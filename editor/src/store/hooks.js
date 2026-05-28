import { useContext, useState, useEffect, useCallback } from '@wordpress/element';
import { BlockContext } from './Provider';

export function useBlockContext() {
	const ctx = useContext( BlockContext );
	if ( ! ctx ) {
		throw new Error( 'useBlockContext must be used within a BlockProvider' );
	}
	return ctx;
}

export function useFieldValue( key ) {
	const { state, saveField, subscribe } = useBlockContext();
	const [ value, setValue ] = useState( state[ key ] );

	useEffect( () => {
		return subscribe( key, ( newValue ) => {
			setValue( newValue );
		} );
	}, [ key, subscribe ] );

	const onChange = useCallback( ( newValue ) => {
		saveField( key, newValue );
	}, [ key, saveField ] );

	return [ value, onChange ];
}
