import { useRef, useCallback } from '@wordpress/element';
import { BaseControl, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { uid } from '../../engine/uid';
import { buildEmpty } from '../../engine/values';
import RepeaterItem from './RepeaterItem';

function ensureIds( items ) {
	return items.map( ( item ) => {
		if ( item._defb_id ) {
			return item;
		}
		return { ...item, _defb_id: uid() };
	} );
}

export default function Repeater( { name, field, value, onChange } ) {
	const raw = Array.isArray( value ) ? value : [];
	const items = ensureIds( raw );
	const itemsRef = useRef( items );
	itemsRef.current = items;

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 5 } } ),
		useSensor( KeyboardSensor )
	);

	const subFields = field.fields || {};
	const maxItems = field.max || Infinity;
	const minItems = field.min || 0;

	const handleDragEnd = useCallback( ( event ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		const current = itemsRef.current;
		const oldIndex = current.findIndex( ( it ) => it._defb_id === active.id );
		const newIndex = current.findIndex( ( it ) => it._defb_id === over.id );
		if ( oldIndex === -1 || newIndex === -1 ) {
			return;
		}
		onChange( arrayMove( current, oldIndex, newIndex ) );
	}, [ onChange ] );

	const handleFieldChange = useCallback( ( index, key, val ) => {
		const current = itemsRef.current;
		const next = current.map( ( item, i ) =>
			i === index ? { ...item, [ key ]: val } : item
		);
		onChange( next );
	}, [ onChange ] );

	const handleAdd = useCallback( () => {
		const current = itemsRef.current;
		if ( current.length >= maxItems ) {
			return;
		}
		const empty = { _defb_id: uid() };
		Object.keys( subFields ).forEach( ( key ) => {
			empty[ key ] = buildEmpty( subFields[ key ] );
		} );
		onChange( [ ...current, empty ] );
	}, [ maxItems, subFields, onChange ] );

	const handleRemove = useCallback( ( index ) => {
		const current = itemsRef.current;
		if ( current.length <= minItems ) {
			return;
		}
		onChange( current.filter( ( _, i ) => i !== index ) );
	}, [ minItems, onChange ] );

	const handleDuplicate = useCallback( ( index ) => {
		const current = itemsRef.current;
		if ( current.length >= maxItems ) {
			return;
		}
		const clone = { ...current[ index ], _defb_id: uid() };
		const next = [ ...current ];
		next.splice( index + 1, 0, clone );
		onChange( next );
	}, [ maxItems, onChange ] );

	const getPreviewLabel = ( item, index ) => {
		if ( field.previewKey && item[ field.previewKey ] ) {
			return String( item[ field.previewKey ] );
		}
		return sprintf( __( 'Item %d', 'define-blocks' ), index + 1 );
	};

	const sortableIds = items.map( ( it ) => it._defb_id );

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<div className="defb-repeater">
				<DndContext
					sensors={ sensors }
					collisionDetection={ closestCenter }
					onDragEnd={ handleDragEnd }
				>
					<SortableContext items={ sortableIds } strategy={ verticalListSortingStrategy }>
						{ items.map( ( item, index ) => (
							<RepeaterItem
								key={ item._defb_id }
								id={ item._defb_id }
								index={ index }
								fields={ subFields }
								values={ item }
								onFieldChange={ handleFieldChange }
								onRemove={ handleRemove }
								onDuplicate={ handleDuplicate }
								previewLabel={ getPreviewLabel( item, index ) }
								canRemove={ items.length > minItems }
							/>
						) ) }
					</SortableContext>
				</DndContext>
				{ items.length < maxItems && (
					<Button
						variant="secondary"
						className="defb-repeater__add"
						icon="plus-alt2"
						onClick={ handleAdd }
					>
						{ field.addLabel || __( 'Add Item', 'define-blocks' ) }
					</Button>
				) }
			</div>
		</BaseControl>
	);
}
