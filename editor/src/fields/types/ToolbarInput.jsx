import { useState, useRef, useEffect } from '@wordpress/element';
import { ToolbarButton, Popover, TextControl } from '@wordpress/components';

export default function ToolbarInput( { name, field, value, onChange } ) {
	const [ open, setOpen ] = useState( false );
	const buttonRef = useRef( null );
	const inputRef = useRef( null );

	useEffect( () => {
		if ( open && inputRef.current ) {
			const el = inputRef.current.querySelector( 'input' );
			if ( el ) { el.focus(); }
		}
	}, [ open ] );

	const isNumber = field.type === 'number' || field._toolbarType === 'number';

	return (
		<>
			<ToolbarButton
				ref={ buttonRef }
				icon={ field.icon || ( isNumber ? 'editor-ol' : 'edit' ) }
				label={ field.label }
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
					<div ref={ inputRef } style={ { padding: '12px', minWidth: '200px' } }>
						<TextControl
							label={ field.label }
							value={ value ?? '' }
							type={ isNumber ? 'number' : 'text' }
							min={ field.min }
							max={ field.max }
							step={ field.step }
							placeholder={ field.placeholder }
							onChange={ ( val ) => onChange( isNumber ? Number( val ) : val ) }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' ) { setOpen( false ); }
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
