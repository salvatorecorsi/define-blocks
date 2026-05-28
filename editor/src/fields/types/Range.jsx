import { RangeControl } from '@wordpress/components';

export default function Range( { name, field, value, onChange, onBlur } ) {
	return (
		<RangeControl
			label={ field.label }
			help={ field.description }
			value={ value ?? field.min ?? 0 }
			onChange={ ( val ) => { onChange( val ); if ( onBlur ) { onBlur(); } } }
			min={ field.min ?? 0 }
			max={ field.max ?? 100 }
			step={ field.step ?? 1 }
			__next40pxDefaultSize={true}
		/>
	);
}
