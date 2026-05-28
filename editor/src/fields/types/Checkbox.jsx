import { ToggleControl } from '@wordpress/components';
import { doAction } from '@wordpress/hooks';

export default function Checkbox( { name, field, value, onChange, onBlur } ) {
	const handleChange = ( checked ) => {
		onChange( checked );
		if ( onBlur ) { onBlur(); }
		doAction( `defb.toggle.${ name }`, checked );
	};

	return (
		<ToggleControl
			label={ field.label }
			help={ field.description }
			checked={ !! value }
			onChange={ handleChange }
		/>
	);
}
