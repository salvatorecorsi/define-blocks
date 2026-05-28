import { RichText as WPRichText } from '@wordpress/block-editor';
import { BaseControl } from '@wordpress/components';

export default function RichText( { name, field, value, onChange } ) {
	return (
		<BaseControl label={ field.label } help={ field.description }>
			<WPRichText
				tagName={ field.tagName || 'div' }
				placeholder={ field.placeholder }
				value={ value ?? '' }
				onChange={ onChange }
				allowedFormats={ field.allowedFormats }
			/>
		</BaseControl>
	);
}
