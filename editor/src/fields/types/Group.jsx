import FieldsRenderer from '../Renderer';
import { BaseControl } from '@wordpress/components';

export default function Group( { field } ) {
	if ( ! field.fields ) {
		return null;
	}

	return (
		<BaseControl label={ field.label }>
			<FieldsRenderer fields={ field.fields } />
		</BaseControl>
	);
}
