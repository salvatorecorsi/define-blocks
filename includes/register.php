<?php
/**
 * Block registration API and schema normalization.
 *
 * @package DefineBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register a block type.
 *
 * Each call attaches its own filter callback — no global array needed.
 *
 * @param string $name Fully-qualified block name (e.g. 'myplugin/hero').
 * @param array  $args Block configuration.
 */
function define_block_type( string $name, array $args = [] ): void { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
	$args['name'] = $name;

	if ( array_key_exists( 'frontend_preview', $args ) ) {
		$args['settings'] = $args['settings'] ?? [];
		$args['settings']['frontendPreview'] = true;
		$args['settings']['startPreview']    = (bool) $args['frontend_preview'];
		unset( $args['frontend_preview'] );
	}

	add_filter( 'defb_register', static function ( array $blocks ) use ( $name, $args ): array {
		$blocks[ $name ] = $args;
		return $blocks;
	} );
}

/**
 * Retrieve all registered blocks, keyed by name. Memoized per post_id.
 */
function defb_registered( ?int $post_id = null ): array {
	static $memo = [];
	$key = $post_id ?? 0;

	if ( ! isset( $memo[ $key ] ) ) {
		$raw = apply_filters( 'defb_register', [], $post_id );

		$indexed = [];
		foreach ( $raw as $k => $block ) {
			$indexed[ $block['name'] ?? $k ] = $block;
		}

		$memo[ $key ] = $indexed;
	}

	return $memo[ $key ];
}

// ── Public read API ─────────────────────────────────────────────────

function defb_get_block( int $post_id, string $block_name, ?string $field = null ): mixed { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
	$blocks = defb_get_blocks( $post_id, $block_name );
	if ( empty( $blocks ) ) {
		return null;
	}
	$values = $blocks[0];
	return $field !== null ? ( $values[ $field ] ?? null ) : $values;
}

function defb_get_blocks( int $post_id, string $block_name ): array { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
	$post = get_post( $post_id );
	if ( ! $post ) {
		return [];
	}

	$parsed  = parse_blocks( $post->post_content );
	$results = [];
	defb_find_blocks( $parsed, $block_name, $results );

	return $results;
}

function defb_find_blocks( array $blocks, string $block_name, array &$results ): void {
	foreach ( $blocks as $block ) {
		if ( ( $block['blockName'] ?? '' ) === $block_name ) {
			$results[] = $block['attrs']['values'] ?? [];
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			defb_find_blocks( $block['innerBlocks'], $block_name, $results );
		}
	}
}

// ── Schema normalization ────────────────────────────────────────────

function defb_field_aliases(): array {
	static $map = null;
	if ( $map !== null ) {
		return $map;
	}

	$map = [
		'image' => 'media', 'img' => 'media', 'picture' => 'media',
		'innerblock' => 'innerblocks', 'inner-block' => 'innerblocks', 'inner-blocks' => 'innerblocks',
		'multiautocomplete' => 'multi-autocomplete', 'multi_autocomplete' => 'multi-autocomplete', 'multi-auto-complete' => 'multi-autocomplete',
		'multiselect' => 'multi-select', 'multi_select' => 'multi-select', 'select-multi' => 'multi-select', 'multi-selects' => 'multi-select',
		'postselector' => 'post-selector', 'post_selector' => 'post-selector', 'postselectorfield' => 'post-selector',
		'maptarget' => 'google-map', 'map_target' => 'google-map', 'map-target' => 'google-map',
		'map-bounds' => 'google-map', 'map-pointer' => 'google-map', 'maps' => 'google-map', 'map' => 'google-map',
		'osm' => 'osm-map', 'openstreetmap' => 'osm-map', 'open-street-map' => 'osm-map', 'leaflet' => 'osm-map',
		'tabpanel' => 'tabpanels', 'tab-panel' => 'tabpanels', 'tab-panels' => 'tabpanels', 'tabs' => 'tabpanels',
		'target' => 'text', 'number' => 'text',
		'textwithparser' => 'text-with-parser', 'text_with_parser' => 'text-with-parser',
		'rich_text' => 'richtext', 'rich-text' => 'richtext', 'editor' => 'richtext', 'classic-editor' => 'richtext',
		'text-area' => 'textarea', 'code' => 'textarea', 'json' => 'textarea',
		'radio' => 'select',
		'combobox' => 'autocomplete',
		'toggle' => 'checkbox', 'switch' => 'checkbox',
		'tokenfield' => 'chips',
		'datetimepicker' => 'datetime', 'datepicker' => 'date',
		'cta' => 'link', 'button' => 'link',
	];

	return $map;
}

/**
 * Resolve a block's schema into the normalized four-scope structure.
 *
 * Accepts two forms:
 *   1. Associative array → shorthand, all fields go to content scope
 *   2. Sequential array  → each item must declare a `scope` key
 */
function defb_resolve_schema( array $block ): array {
	$out = [
		'content'            => [ 'fields' => [] ],
		'inspector'          => [],
		'inspector-advanced' => [ 'fields' => [] ],
		'toolbar'            => [],
	];

	if ( empty( $block['schema'] ) ) {
		return $out;
	}

	$schema = $block['schema'];

	if ( ! array_is_list( $schema ) ) {
		$out['content']['fields'] = defb_prepare_fields( $schema );
		return $out;
	}

	$panel_idx = 0;

	foreach ( $schema as $entry ) {
		$scope  = $entry['scope'] ?? null;
		if ( $scope === null ) {
			continue;
		}

		$fields = isset( $entry['fields'] ) ? defb_prepare_fields( $entry['fields'] ) : [];

		match ( $scope ) {
			'content' => $out['content']['fields'] = array_merge( $out['content']['fields'], $fields ),

			'inspector' => $out['inspector'][] = [
				'panel'       => $entry['panel'] ?? ( __( 'Panel', 'define-blocks' ) . ' ' . ++$panel_idx ),
				'icon'        => $entry['icon'] ?? null,
				'initialOpen' => $entry['initialOpen'] ?? true,
				'fields'      => $fields,
			],

			'inspector-advanced' => $out['inspector-advanced']['fields'] = array_merge(
				$out['inspector-advanced']['fields'], $fields,
			),

			'toolbar' => $out['toolbar'][] = [
				'group'  => $entry['group'] ?? 'block',
				'fields' => $fields,
			],

			'toolbar-dropdown' => $out['toolbar'][] = [
				'type'   => 'dropdown',
				'group'  => $entry['group'] ?? 'other',
				'icon'   => $entry['icon'] ?? null,
				'label'  => $entry['label'] ?? '',
				'fields' => $fields,
			],

			default => null,
		};
	}

	return $out;
}

/**
 * Prepare a raw fields array into a name-keyed, alias-resolved map.
 */
function defb_prepare_fields( mixed $fields ): array {
	if ( ! is_array( $fields ) ) {
		return [];
	}

	$out = [];

	foreach ( $fields as $key => $field ) {
		if ( is_int( $key ) && isset( $field['name'] ) ) {
			$fname = $field['name'];
			unset( $field['name'] );
			$out[ $fname ] = defb_prepare_field( $field );
		} elseif ( is_string( $key ) ) {
			$out[ $key ] = defb_prepare_field( $field );
		}
	}

	return $out;
}

/**
 * Resolve type aliases on a single field and recurse into nested structures.
 */
function defb_prepare_field( mixed $field ): mixed {
	if ( ! is_array( $field ) ) {
		return $field;
	}

	if ( isset( $field['show'] ) && ! isset( $field['condition'] ) ) {
		$field['condition'] = $field['show'];
		unset( $field['show'] );
	}

	if ( isset( $field['hide'] ) && ! isset( $field['conditionHide'] ) ) {
		$field['conditionHide'] = $field['hide'];
		unset( $field['hide'] );
	}

	if ( isset( $field['persistAs'] ) && ! isset( $field['saveInMeta'] ) ) {
		$field['saveInMeta'] = $field['persistAs'];
		unset( $field['persistAs'] );
	}

	if ( isset( $field['type'] ) && is_string( $field['type'] ) ) {
		$canonical = strtolower( trim( $field['type'] ) );
		$field['type'] = defb_field_aliases()[ $canonical ] ?? $canonical;
	}

	if ( ! empty( $field['fields'] ) && is_array( $field['fields'] ) ) {
		$field['fields'] = defb_prepare_fields( $field['fields'] );
	}

	if ( ! empty( $field['tabs'] ) && is_array( $field['tabs'] ) ) {
		foreach ( $field['tabs'] as $i => $tab ) {
			if ( ! empty( $tab['fields'] ) && is_array( $tab['fields'] ) ) {
				$field['tabs'][ $i ]['fields'] = defb_prepare_fields( $tab['fields'] );
			}
		}
	}

	return $field;
}

/**
 * Walk a resolved schema and collect every field that declares a default value.
 */
function defb_collect_defaults( array $schema ): array {
	$defaults = [];

	$walk = static function ( array $fields ) use ( &$defaults, &$walk ): void {
		foreach ( $fields as $key => $field ) {
			if ( ! is_array( $field ) ) {
				continue;
			}
			if ( array_key_exists( 'default', $field ) ) {
				$defaults[ $key ] = $field['default'];
			}
			if ( ! empty( $field['tabs'] ) ) {
				foreach ( $field['tabs'] as $tab ) {
					if ( ! empty( $tab['fields'] ) ) {
						$walk( $tab['fields'] );
					}
				}
			}
			if ( ! empty( $field['fields'] ) ) {
				$walk( $field['fields'] );
			}
		}
	};

	foreach ( [ 'content', 'inspector-advanced' ] as $scope ) {
		if ( ! empty( $schema[ $scope ]['fields'] ) ) {
			$walk( $schema[ $scope ]['fields'] );
		}
	}

	foreach ( [ 'inspector', 'toolbar' ] as $scope ) {
		foreach ( ( $schema[ $scope ] ?? [] ) as $section ) {
			if ( ! empty( $section['fields'] ) ) {
				$walk( $section['fields'] );
			}
		}
	}

	return $defaults;
}
