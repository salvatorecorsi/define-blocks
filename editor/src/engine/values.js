import { resolveType } from '../fields/aliases';

export function collectDefaults( schema ) {
	const defaults = {};

	const walkFields = ( fields ) => {
		Object.entries( fields ).forEach( ( [ key, field ] ) => {
			if ( field.default !== undefined ) {
				defaults[ key ] = field.default;
			}
			if ( field.tabs ) {
				Object.values( field.tabs ).forEach( ( tab ) => {
					if ( tab.fields ) {
						walkFields( tab.fields );
					}
				} );
			}
		} );
	};

	[ 'content', 'inspector-advanced' ].forEach( ( scope ) => {
		if ( schema[ scope ]?.fields ) {
			walkFields( schema[ scope ].fields );
		}
	} );

	[ 'inspector', 'toolbar' ].forEach( ( scope ) => {
		( schema[ scope ] || [] ).forEach( ( section ) => {
			if ( section.fields ) {
				walkFields( section.fields );
			}
		} );
	} );

	return defaults;
}

export function buildEmpty( field ) {
	const type = resolveType( field.type );

	switch ( type ) {
		case 'repeater':
			return [];
		case 'gallery':
			return [];
		case 'media':
		case 'file':
			return {};
		case 'link':
			return { url: '', title: '', opensInNewTab: false };
		case 'checkbox':
			return false;
		case 'range':
			return field.min ?? 0;
		case 'chips':
		case 'multi-select':
		case 'multi-autocomplete':
			return [];
		case 'color':
			return '';
		default:
			return field.default ?? '';
	}
}

export function parseFieldValue( value, type ) {
	const resolved = resolveType( type );

	if ( resolved === 'checkbox' ) {
		return !! value;
	}

	if ( resolved === 'range' && typeof value === 'string' ) {
		return parseFloat( value ) || 0;
	}

	return value;
}
