<?php
/**
 * Frontend block rendering.
 *
 * @package DefineBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', static function (): void {
	if ( is_admin() || wp_doing_ajax() ) {
		return;
	}

	$default_supports = [
		'align'           => true,
		'alignWide'       => true,
		'html'            => true,
		'customClassName' => true,
		'color'           => [ 'background' => true, 'text' => true, 'gradients' => true ],
		'spacing'         => [ 'margin' => true, 'padding' => true, 'blockGap' => true ],
	];

	foreach ( defb_registered() as $block ) {
		$name = $block['name'] ?? '';
		if ( ! $name ) {
			continue;
		}

		$captured = $block;

		register_block_type( $name, [
			'supports'        => array_merge( $default_supports, $block['supports'] ?? [] ),
			'render_callback' => static function ( array $attributes, string $content, \WP_Block $wp_block ) use ( $captured ): string {
				$attrs = $wp_block->parsed_block['attrs'] ?? [];
				$html  = defb_render_output( $captured, $attrs, $content, $wp_block );

				if ( $html === null ) {
					return $content;
				}

				$extra = $captured['wrapperClass'] ?? '';
				$wrap  = get_block_wrapper_attributes( $extra ? [ 'class' => $extra ] : [] );

				return '<div ' . $wrap . '>' . $html . '</div>';
			},
		] );
	}
}, 99 );

/**
 * Resolve and execute a block's render.
 *
 * 1. callable  → call directly
 * 2. file path → include as template
 * 3. null      → try auto-derived function name
 * 4. none      → return null (InnerBlocks only)
 */
function defb_render_output( array $block, array $attributes, string $content, ?\WP_Block $wp_block = null ): ?string {
	$render = $block['render'] ?? null;
	$invoke = static fn( callable $fn ) => $wp_block
		? $fn( $attributes, $content, $wp_block )
		: $fn( $attributes, $content );

	if ( $render !== null && is_callable( $render ) ) {
		return $invoke( $render );
	}

	if ( is_string( $render ) && file_exists( $render ) ) {
		ob_start();
		( static function ( string $_tpl, array $attributes, string $content, ?\WP_Block $block ): void {
			include $_tpl;
		} )( $render, $attributes, $content, $wp_block );
		return ob_get_clean();
	}

	if ( $render === null ) {
		$fn_name = defb_infer_callback( $block['name'] ?? '' );
		if ( $fn_name && function_exists( $fn_name ) ) {
			return $invoke( $fn_name );
		}
	}

	return null;
}

/**
 * Derive a render callback name from a block name.
 * 'myplugin/hero-banner' → 'myplugin_hero_banner_render'
 */
function defb_infer_callback( string $block_name ): string {
	if ( ! str_contains( $block_name, '/' ) ) {
		return '';
	}
	return str_replace( [ '/', '-' ], '_', $block_name ) . '_render';
}
