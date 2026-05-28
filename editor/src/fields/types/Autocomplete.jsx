import { useState, useRef, useCallback } from '@wordpress/element';
import { ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

const HINT = '__defb_hint__';

export default function Autocomplete( { name, field, value, onChange } ) {
	const [ remoteOptions, setRemoteOptions ] = useState( [] );
	const [ hasSearched, setHasSearched ] = useState( false );
	const debounceRef = useRef( null );

	const staticOptions = ( field.options || [] ).map( ( opt ) => {
		if ( typeof opt === 'string' ) {
			return { value: opt, label: opt };
		}
		return { value: String( opt.value ), label: opt.label };
	} );

	const handleFilterChange = useCallback(
		( search ) => {
			if ( ! field.postType ) {
				return;
			}

			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}

			if ( ! search || search.length < 2 ) {
				setRemoteOptions( [] );
				setHasSearched( false );
				return;
			}

			debounceRef.current = setTimeout( async () => {
				try {
					const results = await apiFetch( {
						path: '/defb/v1/posts/search',
						method: 'POST',
						data: { s: search, post_type: field.postType },
					} );
					setRemoteOptions(
						( results || [] ).map( ( post ) => ( {
							value: String( post.id ),
							label: post.title,
						} ) )
					);
				} catch {
					setRemoteOptions( [] );
				}
				setHasSearched( true );
			}, 300 );
		},
		[ field.postType ]
	);

	let currentOptions;
	if ( field.postType ) {
		currentOptions = hasSearched
			? remoteOptions
			: [ { value: HINT, label: field.placeholder || __( 'Type to search…', 'define-blocks' ) } ];
	} else {
		currentOptions = staticOptions;
	}

	const handleChange = ( val ) => {
		if ( val === HINT ) {
			return;
		}
		onChange( val );
	};

	return (
		<ComboboxControl
			__next40pxDefaultSize
			label={ field.label }
			help={ field.description }
			value={ value ?? '' }
			options={ currentOptions }
			onChange={ handleChange }
			onFilterValueChange={ handleFilterChange }
		/>
	);
}
