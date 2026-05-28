import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import Edit from './block/Edit';
import { setupRuntime } from './engine/runtime';
import './styles/index.scss';

setupRuntime();

const { blocks = {} } = window.defineBlocks || {};

function schemaHasInnerBlocks( schema ) {
	const scan = ( fields ) =>
		Object.values( fields || {} ).some( ( field ) => {
			if ( field.type === 'innerblocks' ) {
				return true;
			}
			if ( field.fields ) {
				return scan( field.fields );
			}
			if ( field.tabs ) {
				return Object.values( field.tabs ).some( ( tab ) => scan( tab.fields ) );
			}
			return false;
		} );

	if ( scan( schema.content?.fields ) ) {
		return true;
	}
	if ( scan( schema[ 'inspector-advanced' ]?.fields ) ) {
		return true;
	}
	return ( schema.inspector || [] ).some( ( panel ) => scan( panel.fields ) );
}

Object.entries( blocks ).forEach( ( [ name, blockData ] ) => {
	const schema = blockData._schema || {};
	const defaults = blockData._defaults || {};

	const attributeDefaults = {};
	Object.entries( defaults ).forEach( ( [ key, val ] ) => {
		attributeDefaults[ key ] = { type: typeof val === 'object' ? 'object' : typeof val, default: val };
	} );

	const blockSettings = blockData.settings || {};
	const hasInnerBlocks = schemaHasInnerBlocks( schema );

	let settings = {
		apiVersion: 3,
		title: blockData.title || name,
		description: blockData.description || '',
		icon: blockData.icon || 'block-default',
		category: blockData.category || 'common',
		keywords: blockData.keywords || [],
		supports: blockData.supports || {},
		attributes: {
			values: { type: 'object', default: defaults },
			isPreview: { type: 'boolean', default: !! blockSettings.startPreview },
			collapsed: { type: 'boolean', default: false },
			...attributeDefaults,
		},
		edit: ( props ) => <Edit { ...props } blockData={ blockData } schema={ schema } />,
		save: hasInnerBlocks ? () => <InnerBlocks.Content /> : () => null,
	};

	settings = applyFilters( 'defb.blockSettings', settings, name, blockData );

	registerBlockType( name, settings );

	window.DefineBlocks.Registry[ name ] = blockData;
} );
