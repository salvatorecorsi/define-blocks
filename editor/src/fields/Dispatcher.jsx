import { memo, useCallback } from '@wordpress/element';
import { useFieldValue, useBlockContext } from '../store/hooks';
import { resolveType } from './aliases';
import { getFieldComponent } from './registry';
import { evaluateCondition } from '../engine/conditions';

const TOOLBAR_TYPE_MAP = {
	select: 'toolbar-select',
	checkbox: 'toolbar-toggle',
	toggle: 'toolbar-toggle',
	text: 'toolbar-input',
	number: 'toolbar-input',
	autocomplete: 'toolbar-autocomplete',
};

function Dispatcher( { name, field, scope } ) {
	const type = resolveType( field.type );
	const [ value, onChange ] = useFieldValue( name );
	const { state, touchField, getFieldError } = useBlockContext();

	const isToolbar = scope === 'toolbar';
	const onBlur = useCallback( () => {
		if ( ! isToolbar ) {
			touchField( name );
		}
	}, [ isToolbar, touchField, name ] );

	if ( field.condition && ! evaluateCondition( field.condition, state ) ) {
		return null;
	}

	if ( field.conditionHide && evaluateCondition( field.conditionHide, state ) ) {
		return null;
	}

	if ( field.visible === false ) {
		return null;
	}

	const resolvedType = isToolbar && TOOLBAR_TYPE_MAP[ type ] ? TOOLBAR_TYPE_MAP[ type ] : type;
	const Component = getFieldComponent( resolvedType );

	const error = isToolbar ? null : getFieldError( name );

	const fieldProps = { name, field, type, value, onChange, onBlur };
	if ( isToolbar && type === 'number' ) {
		fieldProps.field = { ...field, _toolbarType: 'number' };
	}

	if ( isToolbar ) {
		return <Component { ...fieldProps } />;
	}

	const style = {};
	if ( field.width ) {
		style.width = `${ field.width }%`;
	}
	if ( field.style ) {
		Object.assign( style, field.style );
	}

	const className = `defb-field${ error ? ' defb-field--error' : '' }`;

	return (
		<div className={ className } style={ style } data-field-type={ type } data-field-name={ name }>
			<Component { ...fieldProps } />
			{ error && <p className="defb-field__error">{ error }</p> }
		</div>
	);
}

export default memo( Dispatcher );
