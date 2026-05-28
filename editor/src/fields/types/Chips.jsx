import { __ } from '@wordpress/i18n';
import ChipsInput from '../shared/ChipsInput';

export default function Chips( { name, field, value, onChange } ) {
	const staticOptions = ( field.options || [] ).map( ( opt ) => {
		if ( typeof opt === 'string' ) {
			return { value: opt, label: opt };
		}
		return { value: String( opt.value ), label: opt.label };
	} );

	return (
		<ChipsInput
			label={ field.label }
			help={ field.description }
			value={ value || [] }
			options={ staticOptions }
			onChange={ onChange }
			placeholder={ field.placeholder }
			allowCreate
			createLabel={ field.createLabel || __( 'Create', 'define-blocks' ) }
			draggable={ field.draggable || false }
		/>
	);
}
