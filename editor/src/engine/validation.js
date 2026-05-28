import { resolveType } from '../fields/aliases';

function isEmpty( value ) {
	if ( value === null || value === undefined || value === '' ) {
		return true;
	}
	if ( Array.isArray( value ) && value.length === 0 ) {
		return true;
	}
	if ( typeof value === 'object' && ! Array.isArray( value ) ) {
		return Object.values( value ).every( ( v ) => v === '' || v === null || v === undefined || v === false );
	}
	return false;
}

function parsePattern( pattern ) {
	if ( pattern instanceof RegExp ) {
		return pattern;
	}
	const match = pattern.match( /^\/(.+)\/([gimsuy]*)$/ );
	if ( match ) {
		return new RegExp( match[ 1 ], match[ 2 ] );
	}
	return new RegExp( pattern );
}

export function validateField( value, fieldDef ) {
	if ( ! fieldDef ) {
		return null;
	}

	const msg = fieldDef.message;

	if ( fieldDef.required && isEmpty( value ) ) {
		return msg || 'This field is required';
	}

	if ( ! fieldDef.required && isEmpty( value ) ) {
		return null;
	}

	if ( typeof value === 'string' ) {
		if ( fieldDef.minLength && value.length < fieldDef.minLength ) {
			return msg || `Minimum ${ fieldDef.minLength } characters`;
		}
		if ( fieldDef.maxLength && value.length > fieldDef.maxLength ) {
			return msg || `Maximum ${ fieldDef.maxLength } characters`;
		}
	}

	if ( fieldDef.pattern && typeof value === 'string' ) {
		const regex = parsePattern( fieldDef.pattern );
		if ( ! regex.test( value ) ) {
			return msg || 'Invalid format';
		}
	}

	const numVal = typeof value === 'number' ? value : parseFloat( value );
	if ( ! isNaN( numVal ) ) {
		if ( fieldDef.min !== undefined && numVal < fieldDef.min ) {
			return msg || `Minimum value is ${ fieldDef.min }`;
		}
		if ( fieldDef.max !== undefined && numVal > fieldDef.max ) {
			return msg || `Maximum value is ${ fieldDef.max }`;
		}
	}

	return null;
}

export function findFieldDef( schema, key ) {
	const scopes = [
		schema.content?.fields,
		schema[ 'inspector-advanced' ]?.fields,
	];
	for ( const fields of scopes ) {
		if ( fields?.[ key ] ) {
			return fields[ key ];
		}
	}

	for ( const scope of [ 'inspector', 'toolbar', 'toolbar-dropdown' ] ) {
		const sections = schema[ scope ] || [];
		for ( const section of sections ) {
			if ( section.fields?.[ key ] ) {
				return section.fields[ key ];
			}
		}
	}

	return null;
}

function hasValidationRules( fieldDef ) {
	return fieldDef.required || fieldDef.pattern || fieldDef.minLength ||
		fieldDef.maxLength || fieldDef.min !== undefined || fieldDef.max !== undefined;
}

export function collectValidatableFields( schema ) {
	const fields = {};

	const walk = ( fieldMap ) => {
		if ( ! fieldMap ) {
			return;
		}
		for ( const [ key, def ] of Object.entries( fieldMap ) ) {
			if ( hasValidationRules( def ) ) {
				fields[ key ] = def;
			}
			if ( def.tabs ) {
				for ( const tab of Object.values( def.tabs ) ) {
					walk( tab.fields );
				}
			}
		}
	};

	walk( schema.content?.fields );
	walk( schema[ 'inspector-advanced' ]?.fields );

	for ( const scope of [ 'inspector', 'toolbar', 'toolbar-dropdown' ] ) {
		for ( const section of schema[ scope ] || [] ) {
			walk( section.fields );
		}
	}

	return fields;
}

export function validateAll( values, schema, conditionEvaluator ) {
	const fields = collectValidatableFields( schema );
	const errors = {};

	for ( const [ key, def ] of Object.entries( fields ) ) {
		if ( conditionEvaluator ) {
			if ( def.condition && ! conditionEvaluator( def.condition, values ) ) {
				continue;
			}
			if ( def.conditionHide && conditionEvaluator( def.conditionHide, values ) ) {
				continue;
			}
		}
		if ( def.visible === false ) {
			continue;
		}

		const error = validateField( values[ key ], def );
		if ( error ) {
			errors[ key ] = error;
		}
	}

	return errors;
}
