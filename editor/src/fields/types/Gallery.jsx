import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, BaseControl } from '@wordpress/components';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableImage( { image, onRemove } ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: image.id } );

	const style = {
		transform: CSS.Transform.toString( transform ),
		transition,
		opacity: isDragging ? 0.5 : 1,
		position: 'relative',
		width: '80px',
		height: '80px',
		borderRadius: '4px',
		overflow: 'hidden',
		cursor: 'grab',
	};

	return (
		<div ref={ setNodeRef } style={ style } { ...attributes } { ...listeners }>
			<img
				src={ image.url }
				alt={ image.alt || '' }
				style={ { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }
			/>
			<button
				type="button"
				onClick={ ( e ) => {
					e.stopPropagation();
					onRemove( image.id );
				} }
				style={ {
					position: 'absolute',
					top: '2px',
					right: '2px',
					width: '18px',
					height: '18px',
					borderRadius: '50%',
					background: 'rgba(0, 0, 0, 0.6)',
					color: '#fff',
					border: 'none',
					cursor: 'pointer',
					fontSize: '12px',
					lineHeight: '18px',
					textAlign: 'center',
					padding: 0,
				} }
				aria-label="Remove image"
			>
				&times;
			</button>
		</div>
	);
}

export default function Gallery( { name, field, value, onChange } ) {
	const images = Array.isArray( value ) ? value : [];
	const imageIds = images.map( ( img ) => img.id );

	const onSelect = ( media ) => {
		const selected = media.map( ( item ) => ( {
			id: item.id,
			url: item.url,
			alt: item.alt || '',
			title: item.title || '',
		} ) );
		onChange( selected );
	};

	const onRemove = ( id ) => {
		onChange( images.filter( ( img ) => img.id !== id ) );
	};

	const onDragEnd = ( event ) => {
		const { active, over } = event;

		if ( ! over || active.id === over.id ) {
			return;
		}

		const oldIndex = images.findIndex( ( img ) => img.id === active.id );
		const newIndex = images.findIndex( ( img ) => img.id === over.id );

		if ( oldIndex !== -1 && newIndex !== -1 ) {
			onChange( arrayMove( images, oldIndex, newIndex ) );
		}
	};

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<div className="defb-gallery-field">
				{ images.length > 0 && (
					<DndContext collisionDetection={ closestCenter } onDragEnd={ onDragEnd }>
						<SortableContext items={ imageIds } strategy={ rectSortingStrategy }>
							<div style={ { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' } }>
								{ images.map( ( image ) => (
									<SortableImage
										key={ image.id }
										image={ image }
										onRemove={ onRemove }
									/>
								) ) }
							</div>
						</SortableContext>
					</DndContext>
				) }
				<MediaUploadCheck>
					<MediaUpload
						onSelect={ onSelect }
						allowedTypes={ [ 'image' ] }
						multiple
						gallery
						value={ imageIds }
						render={ ( { open } ) => (
							<Button variant="secondary" onClick={ open }>
								{ field.buttonLabel || 'Add Images' }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			</div>
		</BaseControl>
	);
}
