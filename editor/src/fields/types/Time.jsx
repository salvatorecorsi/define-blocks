import { BaseControl, Button, DatePicker, TimePicker, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function formatDisplay( value, resolvedType ) {
	if ( ! value ) {
		return null;
	}

	const date = new Date( value );
	if ( isNaN( date.getTime() ) ) {
		return value;
	}

	if ( resolvedType === 'date' ) {
		return date.toLocaleDateString();
	}

	if ( resolvedType === 'time' ) {
		return date.toLocaleTimeString();
	}

	return date.toLocaleString();
}

function placeholderText( resolvedType, field ) {
	if ( field.placeholder ) {
		return field.placeholder;
	}

	const defaults = {
		date: __( 'Select date', 'define-blocks' ),
		time: __( 'Select time', 'define-blocks' ),
		datetime: __( 'Select date and time', 'define-blocks' ),
	};

	return defaults[ resolvedType ] || __( 'Select', 'define-blocks' );
}

export default function Time( { name, field, type, value, onChange } ) {
	const resolvedType = type || field.type || 'date';
	const displayText = formatDisplay( value, resolvedType ) || placeholderText( resolvedType, field );

	const handleDateChange = ( newDate ) => {
		if ( ( resolvedType === 'date' || resolvedType === 'datetime' ) && value ) {
			const existing = new Date( value );
			const incoming = new Date( newDate );
			if ( ! isNaN( existing.getTime() ) && ! isNaN( incoming.getTime() ) ) {
				incoming.setHours( existing.getHours(), existing.getMinutes(), existing.getSeconds() );
				onChange( incoming.toISOString() );
				return;
			}
		}
		onChange( newDate );
	};

	const handleTimeChange = ( newTime ) => {
		onChange( newTime );
	};

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<Dropdown
				popoverProps={ { className: 'defb-datetime-popover' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						variant="secondary"
						onClick={ onToggle }
						aria-expanded={ isOpen }
					>
						{ displayText }
					</Button>
				) }
				renderContent={ () => (
					<div className={ `defb-datetime-content defb-datetime-content--${ resolvedType }` }>
						{ ( resolvedType === 'date' || resolvedType === 'datetime' ) && (
							<DatePicker
								currentDate={ value || undefined }
								onChange={ handleDateChange }
							/>
						) }
						{ ( resolvedType === 'time' || resolvedType === 'datetime' ) && (
							<TimePicker
								currentTime={ value || undefined }
								onChange={ handleTimeChange }
							/>
						) }
					</div>
				) }
			/>
		</BaseControl>
	);
}
