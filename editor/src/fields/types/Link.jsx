import { useState, useEffect, useRef } from '@wordpress/element';
import { TextControl, ToggleControl, BaseControl, Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function Link( { name, field, value, onChange, onBlur } ) {
	const link = value && typeof value === 'object' ? value : { url: '', title: '', opensInNewTab: false };

	const [ query, setQuery ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ showResults, setShowResults ] = useState( false );
	const debounceRef = useRef( null );

	useEffect( () => {
		if ( ! field.postType || ! query || query.length < 2 ) {
			setResults( [] );
			setShowResults( false );
			return;
		}

		if ( debounceRef.current ) {
			clearTimeout( debounceRef.current );
		}

		debounceRef.current = setTimeout( () => {
			setLoading( true );
			apiFetch( {
				path: '/defb/v1/posts/search',
				method: 'POST',
				data: { s: query, post_type: field.postType },
			} )
				.then( ( data ) => {
					setResults( data || [] );
					setShowResults( true );
				} )
				.catch( () => setResults( [] ) )
				.finally( () => setLoading( false ) );
		}, 300 );

		return () => {
			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}
		};
	}, [ query, field.postType ] );

	const update = ( key, val ) => {
		onChange( { ...link, [ key ]: val } );
	};

	const selectResult = ( item ) => {
		onChange( {
			...link,
			url: item.permalink,
			title: link.title || item.title,
			opensInNewTab: link.opensInNewTab,
		} );
		setQuery( '' );
		setResults( [] );
		setShowResults( false );
	};

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<div className="defb-link-field">
				<TextControl
					__next40pxDefaultSize
					placeholder={ field.placeholder || 'https://' }
					value={ link.url }
					onChange={ ( val ) => update( 'url', val ) }
					onBlur={ onBlur }
				/>
				<TextControl
					__next40pxDefaultSize
					placeholder={ field.titlePlaceholder || 'Link text' }
					value={ link.title }
					onChange={ ( val ) => update( 'title', val ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label="Open in new tab"
					checked={ !! link.opensInNewTab }
					onChange={ ( val ) => update( 'opensInNewTab', val ) }
				/>
				{ field.postType && (
					<div className="defb-link-field__search">
						<TextControl
							__next40pxDefaultSize
							placeholder={ `Search ${ field.postType }...` }
							value={ query }
							onChange={ setQuery }
						/>
						{ loading && <Spinner /> }
						{ showResults && results.length > 0 && (
							<ul className="defb-link-field__results">
								{ results.map( ( item ) => (
									<li key={ item.id }>
										<button
											type="button"
											onClick={ () => selectResult( item ) }
										>
											{ item.title }
										</button>
									</li>
								) ) }
							</ul>
						) }
					</div>
				) }
			</div>
		</BaseControl>
	);
}
