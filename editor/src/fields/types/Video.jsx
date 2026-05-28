import { TextControl, BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function extractEmbedUrl( url ) {
	if ( ! url ) {
		return null;
	}

	try {
		const parsed = new URL( url );
		const host = parsed.hostname.replace( 'www.', '' );

		if ( host === 'youtube.com' || host === 'youtu.be' ) {
			let videoId = null;

			if ( host === 'youtu.be' ) {
				videoId = parsed.pathname.slice( 1 );
			} else if ( parsed.pathname.startsWith( '/embed/' ) ) {
				videoId = parsed.pathname.replace( '/embed/', '' );
			} else if ( parsed.pathname === '/watch' ) {
				videoId = parsed.searchParams.get( 'v' );
			}

			if ( videoId ) {
				return `https://www.youtube.com/embed/${ videoId }`;
			}
		}

		if ( host === 'vimeo.com' || host === 'player.vimeo.com' ) {
			const segments = parsed.pathname.split( '/' ).filter( Boolean );

			if ( host === 'player.vimeo.com' && segments[ 0 ] === 'video' ) {
				return url;
			}

			const videoId = segments[ 0 ];
			if ( videoId && /^\d+$/.test( videoId ) ) {
				const hash = segments[ 1 ];
				const embedUrl = `https://player.vimeo.com/video/${ videoId }`;
				return hash ? `${ embedUrl }?h=${ hash }` : embedUrl;
			}
		}
	} catch {
		return null;
	}

	return null;
}

export default function Video( { name, field, value, onChange } ) {
	const embedUrl = extractEmbedUrl( value );

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<TextControl
				__next40pxDefaultSize
				placeholder={ field.placeholder || 'https://youtube.com/watch?v=...' }
				value={ value ?? '' }
				onChange={ onChange }
			/>
			{ embedUrl && (
				<div className="defb-video-preview" style={ { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginTop: '8px' } }>
					<iframe
						src={ embedUrl }
						style={ { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 } }
						allowFullScreen
						title={ field.label || __( 'Video preview', 'define-blocks' ) }
					/>
				</div>
			) }
		</BaseControl>
	);
}
