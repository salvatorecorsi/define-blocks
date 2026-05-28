import { useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import ChipsInput from '../shared/ChipsInput';

export default function MultiAutocomplete( { name, field, value, onChange } ) {
	const staticOptions = ( field.options || [] ).map( ( opt ) => {
		if ( typeof opt === 'string' ) {
			return { value: opt, label: opt };
		}
		return { value: String( opt.value ), label: opt.label };
	} );

	const handleRemoteSearch = useCallback(
		async ( search ) => {
			if ( ! search || search.length < 2 ) {
				return [];
			}

			try {
				const results = await apiFetch( {
					path: '/defb/v1/posts/search',
					method: 'POST',
					data: { s: search, post_type: field.postType },
				} );
				return ( results || [] ).map( ( post ) => ( {
					value: String( post.id ),
					label: post.title,
				} ) );
			} catch {
				return [];
			}
		},
		[ field.postType ]
	);

	return (
		<ChipsInput
			label={ field.label }
			help={ field.description }
			value={ value || [] }
			options={ field.postType ? [] : staticOptions }
			onSearch={ field.postType ? handleRemoteSearch : undefined }
			onChange={ onChange }
			placeholder={ field.placeholder }
			draggable={ field.draggable || false }
		/>
	);
}
