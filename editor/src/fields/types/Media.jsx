import { useState } from '@wordpress/element';
import { MediaUpload, MediaUploadCheck, InspectorControls } from '@wordpress/block-editor';
import { Button, BaseControl, FocalPointPicker, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

export default function Media( { name, field, value, onChange } ) {
	const mediaId = value?.id || value?.ID || 0;
	const mediaUrl = value?.url || '';
	const focus = value?.focus || { x: 0.5, y: 0.5 };
	const hasFocus = !! field.focus;
	const aspectRatio = typeof field.focus === 'string' ? field.focus.replace( ':', ' / ' ) : null;
	const [ liveFocus, setLiveFocus ] = useState( null );

	const onSelect = ( media ) => {
		const next = {
			id: media.id,
			url: media.url,
			alt: media.alt || '',
			title: media.title || '',
			sizes: media.sizes || {},
		};
		if ( hasFocus ) {
			next.focus = value?.focus || { x: 0.5, y: 0.5 };
		}
		onChange( next );
	};

	const onRemove = () => onChange( {} );

	const displayFocus = liveFocus || focus;
	const focusPosition = `${ displayFocus.x * 100 }% ${ displayFocus.y * 100 }%`;

	return (
		<>
			{ hasFocus && mediaUrl && (
				<InspectorControls>
					<PanelBody title={ sprintf( __( '%s — Focus', 'define-blocks' ), field.label || name ) } initialOpen>
						<FocalPointPicker
							url={ mediaUrl }
							value={ displayFocus }
							onDrag={ setLiveFocus }
							onChange={ ( val ) => {
								setLiveFocus( null );
								onChange( { ...value, focus: val } );
							} }
						/>
					</PanelBody>
				</InspectorControls>
			) }

			<BaseControl label={ field.label } help={ field.description }>
				<MediaUploadCheck>
					<MediaUpload
						onSelect={ onSelect }
						allowedTypes={ field.allowedTypes || [ 'image' ] }
						value={ mediaId }
						render={ ( { open } ) => (
							<div className="defb-media-field">
								{ mediaUrl ? (
									<>
										<div className="defb-media-field__preview">
											<img
												src={ mediaUrl }
												alt=""
												style={ hasFocus ? {
													objectPosition: focusPosition,
													...( aspectRatio && { aspectRatio, width: 'auto' } ),
												} : undefined }
											/>
										</div>
										<div className="defb-media-field__actions">
											<Button variant="secondary" size="small" onClick={ open }>
												{ __( 'Replace', 'define-blocks' ) }
											</Button>
											<Button variant="tertiary" size="small" isDestructive onClick={ onRemove }>
												{ __( 'Remove', 'define-blocks' ) }
											</Button>
										</div>
									</>
								) : (
									<Button variant="secondary" onClick={ open }>
										{ field.buttonLabel || __( 'Select Image', 'define-blocks' ) }
									</Button>
								) }
							</div>
						) }
					/>
				</MediaUploadCheck>
			</BaseControl>
		</>
	);
}
