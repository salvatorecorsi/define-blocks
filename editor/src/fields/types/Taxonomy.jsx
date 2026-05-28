import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import ChipsInput from '../shared/ChipsInput';

export default function Taxonomy( { name, field, value, onChange } ) {
	const taxonomySlug = field.taxonomy || 'category';

	const { terms, restBase } = useSelect(
		( select ) => {
			const core = select( 'core' );
			const taxonomy = core.getTaxonomy( taxonomySlug );
			return {
				terms: core.getEntityRecords( 'taxonomy', taxonomySlug, { per_page: -1 } ),
				restBase: taxonomy?.rest_base || taxonomySlug,
			};
		},
		[ taxonomySlug ]
	);

	const termOptions = ( terms || [] ).map( ( term ) => ( {
		value: String( term.id ),
		label: term.name,
	} ) );

	const handleCreate = useCallback(
		async ( search ) => {
			if ( ! search || search.length < 1 ) {
				return [];
			}

			const needle = search.toLowerCase();
			return termOptions.filter( ( opt ) =>
				opt.label.toLowerCase().includes( needle )
			);
		},
		[ termOptions ]
	);

	const handleAdd = useCallback(
		async ( newValue ) => {
			const lastItem = newValue[ newValue.length - 1 ];
			const isNew = lastItem && ! termOptions.some( ( opt ) => opt.value === lastItem.value );

			if ( isNew && field.allowCreate ) {
				try {
					const created = await apiFetch( {
						path: `/wp/v2/${ field.restBase || restBase }`,
						method: 'POST',
						data: { name: lastItem.label },
					} );

					const updatedValue = newValue.map( ( item ) => {
						if ( item.value === lastItem.value ) {
							return { value: String( created.id ), label: created.name };
						}
						return item;
					} );

					onChange( updatedValue );
					return;
				} catch {
					onChange( newValue );
					return;
				}
			}

			onChange( newValue );
		},
		[ field.allowCreate, field.restBase, restBase, termOptions, onChange ]
	);

	return (
		<ChipsInput
			label={ field.label }
			help={ field.description }
			value={ value || [] }
			options={ termOptions }
			onChange={ handleAdd }
			placeholder={ field.placeholder }
			allowCreate={ field.allowCreate || false }
			createLabel={ field.createLabel || __( 'Create', 'define-blocks' ) }
			draggable={ field.draggable || false }
		/>
	);
}
