import { useState, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Spinner, Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function BlockPreview( { blockName, attributes, onRestore } ) {
	const postId = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostId(), [] );
	const [ html, setHtml ] = useState( '' );
	const [ loading, setLoading ] = useState( true );
	const abortRef = useRef( null );

	useEffect( () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setLoading( true );

		apiFetch( {
			path: '/defb/v1/render',
			method: 'POST',
			data: {
				blockName,
				post_id: postId,
				attributes: attributes.values || {},
				content: '',
			},
			signal: controller.signal,
		} )
			.then( ( res ) => {
				if ( ! controller.signal.aborted ) {
					setHtml( typeof res === 'string' ? res : '' );
					setLoading( false );
				}
			} )
			.catch( ( err ) => {
				if ( err.name !== 'AbortError' ) {
					setHtml( '' );
					setLoading( false );
				}
			} );

		return () => controller.abort();
	}, [ blockName, attributes ] );

	const isEmpty = ! loading && ( ! html || /^<(p|div)>\s*<\/\1>$/.test( html.trim() ) );

	if ( loading ) {
		return (
			<div className="defb-preview__loading">
				<Spinner />
			</div>
		);
	}

	if ( isEmpty ) {
		return (
			<div className="defb-preview__empty">
				<p>This block returned empty output.</p>
				<Button variant="secondary" onClick={ onRestore }>
					Back to editor
				</Button>
			</div>
		);
	}

	return (
		<div
			className="defb-preview__html"
			dangerouslySetInnerHTML={ { __html: html } }
		/>
	);
}
