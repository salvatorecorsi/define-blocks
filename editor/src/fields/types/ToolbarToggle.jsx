import { ToolbarButton } from '@wordpress/components';
import { doAction } from '@wordpress/hooks';

export default function ToolbarToggle( { name, field, value, onChange } ) {
	const handleClick = () => {
		const next = ! value;
		onChange( next );
		doAction( 'defb.toolbar.toggle', name, next );
	};

	return (
		<ToolbarButton
			icon={ field.icon || 'marker' }
			label={ field.label }
			isPressed={ !! value }
			onClick={ handleClick }
		/>
	);
}
