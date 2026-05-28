import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, BaseControl } from '@wordpress/components';

export default function File( { name, field, value, onChange } ) {
	const fileId = value?.id || 0;
	const fileName = value?.name || '';
	const fileMime = value?.mime || '';

	const onSelect = ( media ) => {
		onChange( {
			id: media.id,
			url: media.url,
			name: media.filename || media.title || '',
			size: media.filesizeHumanReadable || '',
			mime: media.mime || '',
		} );
	};

	const onRemove = () => onChange( {} );

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<MediaUploadCheck>
				<MediaUpload
					onSelect={ onSelect }
					allowedTypes={ field.allowedTypes || undefined }
					value={ fileId }
					render={ ( { open } ) => (
						<div className="defb-file-field">
							{ fileName ? (
								<div className="defb-file-field__info">
									<div style={ { marginBottom: '8px' } }>
										<strong>{ fileName }</strong>
										{ fileMime && (
											<span style={ { marginLeft: '8px', opacity: 0.6 } }>{ fileMime }</span>
										) }
									</div>
									<div className="defb-file-field__actions">
										<Button variant="secondary" size="small" onClick={ open }>
											Replace
										</Button>
										<Button variant="tertiary" size="small" isDestructive onClick={ onRemove }>
											Remove
										</Button>
									</div>
								</div>
							) : (
								<Button variant="secondary" onClick={ open }>
									{ field.buttonLabel || 'Select File' }
								</Button>
							) }
						</div>
					) }
				/>
			</MediaUploadCheck>
		</BaseControl>
	);
}
