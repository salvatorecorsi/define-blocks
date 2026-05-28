import { createContext, useReducer, useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';
import { blockReducer, SET_FIELD, SET_VALUES } from './reducer';
import { FieldSubscriptions } from './subscriptions';
import { validateField, findFieldDef, validateAll } from '../engine/validation';
import { evaluateCondition } from '../engine/conditions';

export const BlockContext = createContext( null );

export function BlockProvider( { blockName, clientId, attributes, setAttributes, schema, children } ) {
	const initial = attributes.values || {};
	const [ state, dispatch ] = useReducer( blockReducer, initial );
	const stateRef = useRef( state );
	const flushTimer = useRef( null );
	const subs = useRef( new FieldSubscriptions() );
	const touchedRef = useRef( new Set() );
	const [ errors, setErrors ] = useState( {} );

	stateRef.current = state;

	const revalidateField = useCallback( ( key, value ) => {
		const fieldDef = findFieldDef( schema, key );
		if ( ! fieldDef ) {
			return;
		}

		if ( fieldDef.condition && ! evaluateCondition( fieldDef.condition, stateRef.current ) ) {
			setErrors( ( prev ) => {
				if ( ! prev[ key ] ) {
					return prev;
				}
				const next = { ...prev };
				delete next[ key ];
				return next;
			} );
			return;
		}
		if ( fieldDef.conditionHide && evaluateCondition( fieldDef.conditionHide, stateRef.current ) ) {
			setErrors( ( prev ) => {
				if ( ! prev[ key ] ) {
					return prev;
				}
				const next = { ...prev };
				delete next[ key ];
				return next;
			} );
			return;
		}

		const error = validateField( value, fieldDef );
		setErrors( ( prev ) => {
			if ( prev[ key ] === error ) {
				return prev;
			}
			if ( error ) {
				return { ...prev, [ key ]: error };
			}
			const next = { ...prev };
			delete next[ key ];
			return next;
		} );
	}, [ schema ] );

	const flushToAttributes = useCallback( () => {
		if ( flushTimer.current ) {
			clearTimeout( flushTimer.current );
		}
		flushTimer.current = setTimeout( () => {
			setAttributes( { values: { ...stateRef.current } } );
		}, 100 );
	}, [ setAttributes ] );

	const saveField = useCallback( ( key, value ) => {
		dispatch( { type: SET_FIELD, key, value } );
		subs.current.notify( key, value );
		flushToAttributes();
		doAction( `defb.change.${ blockName }.${ key }`, value, clientId );

		if ( touchedRef.current.has( key ) ) {
			revalidateField( key, value );
		}
	}, [ blockName, clientId, flushToAttributes, revalidateField ] );

	const getData = useCallback( () => stateRef.current, [] );

	const setAllValues = useCallback( ( values ) => {
		dispatch( { type: SET_VALUES, values } );
		subs.current.notifyAll( values );
		flushToAttributes();
	}, [ flushToAttributes ] );

	const touchField = useCallback( ( key ) => {
		if ( touchedRef.current.has( key ) ) {
			return;
		}
		touchedRef.current.add( key );
		revalidateField( key, stateRef.current[ key ] );
	}, [ revalidateField ] );

	const getFieldError = useCallback( ( key ) => {
		if ( ! touchedRef.current.has( key ) ) {
			return null;
		}
		return errors[ key ] || null;
	}, [ errors ] );

	useEffect( () => {
		const allErrors = validateAll( state, schema, evaluateCondition );
		setErrors( allErrors );
	}, [] );

	useEffect( () => {
		return () => {
			if ( flushTimer.current ) {
				clearTimeout( flushTimer.current );
			}
			setAttributes( { values: { ...stateRef.current } } );
		};
	}, [] );

	const subscribe = useCallback( ( path, cb ) => subs.current.subscribe( path, cb ), [] );

	const hasErrors = Object.keys( errors ).length > 0;

	const ctx = {
		blockName,
		clientId,
		schema,
		state,
		saveField,
		getData,
		setAllValues,
		subscribe,
		touchField,
		getFieldError,
		hasErrors,
	};

	return (
		<BlockContext.Provider value={ ctx }>
			{ children }
		</BlockContext.Provider>
	);
}
