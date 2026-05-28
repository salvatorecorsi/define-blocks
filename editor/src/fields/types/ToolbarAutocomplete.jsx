import { useState, useRef, useEffect, useMemo } from '@wordpress/element';
import { ToolbarButton, Popover, ComboboxControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function ToolbarAutocomplete( { name, field, value, onChange } ) {
	const [ open, setOpen ] = useState( false );
	const [ remoteOptions, setRemoteOptions ] = useState( null );
	const buttonRef = useRef( null );

	useEffect( () => {
		if ( ! field.postType ) { return; }
		let cancelled = false;
		apiFetch( {
			path: '/defb/v1/posts/list',
			method: 'POST',
			data: { post_type: field.postType },
		} ).then( ( results ) => {
			if ( ! cancelled ) {
				setRemoteOptions( ( results || [] ).map( ( p ) => ( {
					label: p.title,
					value: String( p.id ),
				} ) ) );
			}
		} ).catch( () => {} );
		return () => {
			cancelled = true;
		};
	}, [ field.postType ] );

	const staticOptions = useMemo( () => ( field.options || [] ).map( ( opt ) => {
		if ( typeof opt === 'string' ) { return { label: opt, value: opt }; }
		return opt;
	} ), [ field.options ] );

	const options = remoteOptions || staticOptions;

	const current = options.find( ( opt ) => opt.value === value );

	return (
		<>
			<ToolbarButton
				ref={ buttonRef }
				icon={ field.icon || 'search' }
				label={ current ? `${ field.label }: ${ current.label }` : field.label }
				onClick={ () => setOpen( ! open ) }
				isPressed={ open }
			/>
			{ open && (
				<Popover
					anchor={ buttonRef.current }
					placement="bottom-start"
					onClose={ () => setOpen( false ) }
					focusOnMount={ false }
				>
					<div style={ { padding: '12px', minWidth: '240px' } }>
						<ComboboxControl
							label={ field.label }
							value={ value ?? '' }
							options={ options }
							onChange={ ( val ) => {
								onChange( val );
								setOpen( false );
							} }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					</div>
				</Popover>
			) }
		</>
	);
}
