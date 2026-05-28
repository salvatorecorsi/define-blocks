import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { BaseControl, Icon } from '@wordpress/components';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Chip( { item, onRemove } ) {
	return (
		<span className="defb-chips-input__tag">
			<span className="defb-chips-input__tag-label">{ item.label }</span>
			<button
				type="button"
				className="defb-chips-input__tag-remove"
				onClick={ () => onRemove( item.value ) }
				aria-label={ `Remove ${ item.label }` }
			>
				&times;
			</button>
		</span>
	);
}

function SortableChip( { item, onRemove } ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: item.value } );

	const style = {
		transform: CSS.Transform.toString( transform ),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<span
			ref={ setNodeRef }
			style={ style }
			className={ `defb-chips-input__tag${ isDragging ? ' defb-chips-input__tag--dragging' : '' }` }
		>
			<span className="defb-chips-input__tag-handle" { ...attributes } { ...listeners }>
				<Icon icon="menu" size={ 12 } />
			</span>
			<span className="defb-chips-input__tag-label">{ item.label }</span>
			<button
				type="button"
				className="defb-chips-input__tag-remove"
				onClick={ () => onRemove( item.value ) }
				aria-label={ `Remove ${ item.label }` }
			>
				&times;
			</button>
		</span>
	);
}

export default function ChipsInput( {
	label,
	help,
	value = [],
	options = [],
	onChange,
	onSearch,
	placeholder = '',
	allowCreate = false,
	createLabel = 'Create',
	draggable = false,
} ) {
	const items = Array.isArray( value ) ? value : [];
	const [ inputText, setInputText ] = useState( '' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ filteredOptions, setFilteredOptions ] = useState( [] );
	const containerRef = useRef( null );
	const debounceRef = useRef( null );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 5 } } ),
		useSensor( KeyboardSensor )
	);

	const selectedValues = new Set( items.map( ( v ) => v.value ) );

	const filterLocal = useCallback(
		( search ) => {
			const needle = search.trim().toLowerCase();
			const matched = options.filter(
				( opt ) =>
					( ! needle || opt.label.toLowerCase().includes( needle ) ) &&
					! selectedValues.has( opt.value )
			);
			setFilteredOptions( matched );
		},
		[ options, selectedValues ]
	);

	const handleInputChange = ( search ) => {
		setInputText( search );
		setIsOpen( true );

		if ( debounceRef.current ) {
			clearTimeout( debounceRef.current );
		}

		if ( onSearch ) {
			debounceRef.current = setTimeout( async () => {
				const results = await onSearch( search );
				const filtered = ( results || [] ).filter(
					( opt ) => ! selectedValues.has( opt.value )
				);
				setFilteredOptions( filtered );
			}, 300 );
		} else {
			filterLocal( search );
		}
	};

	const addItem = ( item ) => {
		if ( selectedValues.has( item.value ) ) {
			return;
		}
		onChange( [ ...items, item ] );
		setInputText( '' );
		setFilteredOptions( [] );
		setIsOpen( false );
	};

	const removeItem = useCallback( ( itemValue ) => {
		onChange( items.filter( ( v ) => v.value !== itemValue ) );
	}, [ items, onChange ] );

	const handleDragEnd = useCallback( ( event ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		const oldIndex = items.findIndex( ( it ) => it.value === active.id );
		const newIndex = items.findIndex( ( it ) => it.value === over.id );
		if ( oldIndex === -1 || newIndex === -1 ) {
			return;
		}
		onChange( arrayMove( items, oldIndex, newIndex ) );
	}, [ items, onChange ] );

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Escape' ) {
			setIsOpen( false );
			return;
		}

		if ( e.key === 'Enter' ) {
			e.preventDefault();
			if ( filteredOptions.length > 0 ) {
				addItem( filteredOptions[ 0 ] );
			} else if ( allowCreate && inputText.trim() ) {
				addItem( { value: inputText.trim(), label: inputText.trim() } );
			}
		}
	};

	useEffect( () => {
		const handleClickOutside = ( e ) => {
			if ( containerRef.current && ! containerRef.current.contains( e.target ) ) {
				setIsOpen( false );
			}
		};
		document.addEventListener( 'mousedown', handleClickOutside );
		return () => document.removeEventListener( 'mousedown', handleClickOutside );
	}, [] );

	useEffect( () => {
		return () => {
			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}
		};
	}, [] );

	const showCreateOption =
		allowCreate &&
		inputText.trim() &&
		filteredOptions.length === 0 &&
		! selectedValues.has( inputText.trim() );

	const sortableIds = items.map( ( it ) => it.value );

	return (
		<BaseControl label={ label } help={ help }>
			<div className="defb-chips-input" ref={ containerRef }>
				{ items.length > 0 && draggable && (
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						onDragEnd={ handleDragEnd }
					>
						<SortableContext items={ sortableIds } strategy={ horizontalListSortingStrategy }>
							<div className="defb-chips-input__tags">
								{ items.map( ( item ) => (
									<SortableChip
										key={ item.value }
										item={ item }
										onRemove={ removeItem }
									/>
								) ) }
							</div>
						</SortableContext>
					</DndContext>
				) }

				{ items.length > 0 && ! draggable && (
					<div className="defb-chips-input__tags">
						{ items.map( ( item ) => (
							<Chip
								key={ item.value }
								item={ item }
								onRemove={ removeItem }
							/>
						) ) }
					</div>
				) }

				<input
					type="text"
					className="defb-chips-input__search"
					value={ inputText }
					onChange={ ( e ) => handleInputChange( e.target.value ) }
					onFocus={ () => {
					if ( ! onSearch ) {
						filterLocal( inputText );
					}
					setIsOpen( true );
				} }
					onBlur={ () => {
					setTimeout( () => setIsOpen( false ), 150 );
				} }
					onKeyDown={ handleKeyDown }
					placeholder={ placeholder }
				/>

				{ isOpen && ( filteredOptions.length > 0 || showCreateOption ) && (
					<ul className="defb-chips-input__dropdown">
						{ filteredOptions.map( ( opt ) => (
							<li key={ opt.value }>
								<button
									type="button"
									className="defb-chips-input__dropdown-item"
									onClick={ () => addItem( opt ) }
								>
									{ opt.label }
								</button>
							</li>
						) ) }
						{ showCreateOption && (
							<li>
								<button
									type="button"
									className="defb-chips-input__dropdown-item defb-chips-input__dropdown-item--create"
									onClick={ () =>
										addItem( { value: inputText.trim(), label: inputText.trim() } )
									}
								>
									{ createLabel }: { inputText.trim() }
								</button>
							</li>
						) }
					</ul>
				) }
			</div>
		</BaseControl>
	);
}
