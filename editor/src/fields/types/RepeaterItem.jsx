import { useState, useCallback, useMemo, memo } from '@wordpress/element';
import { Button, Icon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { resolveType } from '../aliases';
import { getFieldComponent } from '../registry';
import { evaluateCondition } from '../../engine/conditions';
import { useBlockContext } from '../../store/hooks';

function RepeaterItem( { id, index, fields, values, onFieldChange, onRemove, onDuplicate, previewLabel, canRemove } ) {
	const [ collapsed, setCollapsed ] = useState( false );
	const { state: rootState } = useBlockContext();

	const conditionValues = useMemo( () => {
		const ctx = { ...values, $index: index };
		const root = {};
		for ( const k in rootState ) {
			root[ k ] = rootState[ k ];
		}
		ctx.root = root;
		return ctx;
	}, [ values, index, rootState ] );

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id } );

	const sortableStyle = {
		transform: CSS.Transform.toString( transform ),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const handleRemove = useCallback( () => onRemove( index ), [ onRemove, index ] );
	const handleDuplicate = useCallback( () => onDuplicate( index ), [ onDuplicate, index ] );

	return (
		<div ref={ setNodeRef } style={ sortableStyle } className={ `defb-repeater-item${ isDragging ? ' defb-repeater-item--dragging' : '' }` }>
			<div
				className="defb-repeater-item__header"
				onClick={ () => setCollapsed( ! collapsed ) }
				role="button"
				tabIndex={ 0 }
				onKeyDown={ ( e ) => e.key === 'Enter' && setCollapsed( ! collapsed ) }
			>
				<span
					className="defb-repeater-item__drag"
					{ ...attributes }
					{ ...listeners }
					onClick={ ( e ) => e.stopPropagation() }
				>
					<Icon icon="menu" />
				</span>
				<span className="defb-repeater-item__label">
					{ previewLabel || sprintf( __( 'Item %d', 'define-blocks' ), index + 1 ) }
				</span>
				<Button
					size="small"
					icon="admin-page"
					label={ __( 'Duplicate', 'define-blocks' ) }
					onClick={ ( e ) => { e.stopPropagation(); handleDuplicate(); } }
				/>
				<Button
					size="small"
					icon="trash"
					label={ __( 'Remove', 'define-blocks' ) }
					isDestructive
					disabled={ ! canRemove }
					onClick={ ( e ) => { e.stopPropagation(); handleRemove(); } }
				/>
			</div>
			{ ! collapsed && (
				<div className="defb-repeater-item__body">
					{ Object.entries( fields ).map( ( [ key, fieldDef ] ) => {
						if ( fieldDef.condition && ! evaluateCondition( fieldDef.condition, conditionValues ) ) {
							return null;
						}
						if ( fieldDef.conditionHide && evaluateCondition( fieldDef.conditionHide, conditionValues ) ) {
							return null;
						}
						if ( fieldDef.visible === false ) {
							return null;
						}

						const resolvedType = resolveType( fieldDef.type );
						const Component = getFieldComponent( resolvedType );

						const fieldStyle = {};
						if ( fieldDef.width ) {
							fieldStyle.width = `${ fieldDef.width }%`;
						}

						return (
							<div key={ key } className="defb-field" style={ fieldStyle } data-field-type={ resolvedType }>
								<Component
									name={ key }
									field={ fieldDef }
									type={ resolvedType }
									value={ values[ key ] }
									onChange={ ( val ) => onFieldChange( index, key, val ) }
									onBlur={ () => {} }
								/>
							</div>
						);
					} ) }
				</div>
			) }
		</div>
	);
}

export default memo( RepeaterItem );
