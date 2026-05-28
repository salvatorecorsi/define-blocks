import { useState, useEffect } from '@wordpress/element';
import { SelectControl, Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function Select( { name, field, value, onChange, onBlur } ) {
	const [ remoteOptions, setRemoteOptions ] = useState( null );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		if ( ! field.postType ) {
			return;
		}
		setLoading( true );
		apiFetch( {
			path: '/defb/v1/posts/list',
			method: 'POST',
			data: { post_type: field.postType },
		} ).then( ( results ) => {
			setRemoteOptions( results.map( ( p ) => ( {
				label: p.title,
				value: String( p.id ),
			} ) ) );
			setLoading( false );
		} ).catch( () => {
			setLoading( false );
		} );
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
			options={ hasEmpty ? options : [ { label: field.placeholder || '— Select —', value: '' }, ...options ] }
			onChange={ ( val ) => { onChange( val ); if ( onBlur ) { onBlur(); } } }
		/>
	);
}
