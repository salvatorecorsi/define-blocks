import { ColorPalette, BaseControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

export default function Color( { name, field, value, onChange } ) {
	const themeColors = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		return settings?.colors || [];
	}, [] );

	const palette = field.options || themeColors;

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<ColorPalette
				colors={ palette.length ? palette : undefined }
				value={ value || '' }
				onChange={ ( color ) => onChange( color || '' ) }
				disableCustomColors={ field.disableCustomColors || false }
				clearable
			/>
		</BaseControl>
	);
}
