import { useState, useEffect } from '@wordpress/element';
import { SelectControl, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

export default function Select( { name, field, value, onChange, onBlur } ) {
	const [ remoteOptions, setRemoteOptions ] = useState( null );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		if ( ! field.postType ) {
			return;
		}
		let cancelled = false;
		setLoading( true );
		apiFetch( {
			path: '/defb/v1/posts/list',
			method: 'POST',
			data: { post_type: field.postType },
		} ).then( ( results ) => {
			if ( cancelled ) {
				return;
			}
			setRemoteOptions( ( results || [] ).map( ( p ) => ( {
				label: p.title,
				value: String( p.id ),
			} ) ) );
			setLoading( false );
		} ).catch( () => {
			if ( ! cancelled ) {
				setLoading( false );
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ field.postType ] );

	const staticOptions = ( field.options || [] ).map( ( opt ) => {
		if ( typeof opt === 'string' ) {
			return { label: opt, value: opt };
		}
		return opt;
	} );

	const options = remoteOptions || staticOptions;
	const hasEmpty = options.some( ( opt ) => opt.value === '' );

	if ( loading ) {
		return <Spinner />;
	}

	return (
		<SelectControl
			__next40pxDefaultSize
			label={ field.label }
			help={ field.description }
			value={ value ?? '' }
			options={ hasEmpty ? options : [ { label: field.placeholder || __( '— Select —', 'define-blocks' ), value: '' }, ...options ] }
			onChange={ ( val ) => { onChange( val ); if ( onBlur ) { onBlur(); } } }
		/>
	);
}
