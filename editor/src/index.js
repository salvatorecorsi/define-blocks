import { registerBlockType } from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';
import Edit from './block/Edit';
import { setupRuntime } from './engine/runtime';
import { resolveType } from './fields/aliases';
import { collectDefaults } from './engine/values';
import './styles/index.scss';

setupRuntime();

const { blocks = {} } = window.defineBlocks || {};

Object.entries( blocks ).forEach( ( [ name, blockData ] ) => {
	const schema = blockData._schema || {};
	const defaults = blockData._defaults || {};

	const attributeDefaults = {};
	Object.entries( defaults ).forEach( ( [ key, val ] ) => {
		attributeDefaults[ key ] = { type: typeof val === 'object' ? 'object' : typeof val, default: val };
	} );

	const blockSettings = blockData.settings || {};

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
		save: () => null,
	};

	settings = applyFilters( 'defb.blockSettings', settings, name, blockData );

	registerBlockType( name, settings );

	window.DefineBlocks.Registry[ name ] = blockData;
} );
