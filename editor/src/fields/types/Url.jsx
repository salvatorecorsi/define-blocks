import { useState, useEffect, useRef } from '@wordpress/element';
import { TextControl, BaseControl, Button, Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function Url( { name, field, value, onChange, onBlur } ) {
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
				.catch( () => {
					setResults( [] );
				} )
				.finally( () => {
					setLoading( false );
				} );
		}, 300 );

		return () => {
			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}
		};
	}, [ query, field.postType ] );

	const selectResult = ( permalink ) => {
		onChange( permalink );
		setQuery( '' );
		setResults( [] );
		setShowResults( false );
	};

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<TextControl
				__next40pxDefaultSize
				placeholder={ field.placeholder || 'https://' }
				value={ value ?? '' }
				onChange={ onChange }
				onBlur={ onBlur }
			/>
			{ field.postType && (
				<div className="defb-url-search" style={ { position: 'relative', marginTop: '4px' } }>
					<TextControl
						__next40pxDefaultSize
						placeholder={ `Search ${ field.postType }...` }
						value={ query }
						onChange={ setQuery }
					/>
					{ loading && <Spinner /> }
					{ showResults && results.length > 0 && (
						<div
							className="defb-url-search__results"
							style={ {
								background: '#fff',
								border: '1px solid #ddd',
								borderRadius: '2px',
								maxHeight: '200px',
								overflowY: 'auto',
								position: 'absolute',
								zIndex: 10,
								width: '100%',
								top: '100%',
							} }
						>
							{ results.map( ( item ) => (
								<Button
									key={ item.id }
									variant="tertiary"
									onClick={ () => selectResult( item.permalink ) }
									style={ { display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px' } }
								>
									{ item.title }
								</Button>
							) ) }
						</div>
					) }
				</div>
			) }
		</BaseControl>
	);
}
