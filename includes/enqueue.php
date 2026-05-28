<?php
/**
 * Editor asset enqueuing: scripts, styles, preview CSS, block data.
 *
 * @package DefineBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ── Editor styles (via enqueue_block_assets for iframe compat) ──────

add_action( 'enqueue_block_assets', static function (): void {
	if ( ! is_admin() ) {
		return;
	}

	$fix_path = DEFB_PATH . 'enqueue/fix.css';
	wp_enqueue_style(
		'defb-editor-fix',
		DEFB_URL . 'enqueue/fix.css',
		[],
		file_exists( $fix_path ) ? (string) filemtime( $fix_path ) : DEFB_VERSION,
	);

	$css_path = DEFB_PATH . 'editor/build/index.css';
	wp_enqueue_style(
		'defb-editor-css',
		DEFB_URL . 'editor/build/index.css',
		[ 'wp-edit-blocks', 'dashicons' ],
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : DEFB_VERSION,
	);
} );

// ── Preview scope styles ────────────────────────────────────────────

add_action( 'enqueue_block_assets', static function (): void {
	if ( ! is_admin() ) {
		return;
	}

	$has_preview = false;
	foreach ( defb_registered() as $block ) {
		if ( ! empty( $block['settings']['frontendPreview'] ) ) {
			$has_preview = true;
			break;
		}
	}

	if ( ! $has_preview ) {
		return;
	}

	$sources = apply_filters( 'defb_preview_style', [] );
	$sources = is_string( $sources ) ? [ $sources ] : $sources;

	if ( empty( $sources ) ) {
		return;
	}

	$css = '';
	foreach ( $sources as $src ) {
		$css .= ( is_file( $src ) ? file_get_contents( $src ) : $src ) . "\n";
	}

	if ( $css ) {
		wp_register_style( 'defb-preview-scope', false, [], DEFB_VERSION );
		wp_enqueue_style( 'defb-preview-scope' );
		wp_add_inline_style( 'defb-preview-scope', ".defb-preview {\n{$css}\n}" );
	}
}, 20 );

// ── Editor scripts + block data ─────────────────────────────────────

add_action( 'enqueue_block_editor_assets', static function (): void {
	$save_path = DEFB_PATH . 'enqueue/register-save.js';
	wp_enqueue_script(
		'defb-save-hook',
		DEFB_URL . 'enqueue/register-save.js',
		[ 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor' ],
		file_exists( $save_path ) ? (string) filemtime( $save_path ) : DEFB_VERSION,
		true,
	);

	$post_id = absint( filter_input( INPUT_GET, 'post' ) ) ?: null; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$blocks  = defb_registered( $post_id );

	$blocks = array_map( static function ( array $block ): array {
		$block['_schema'] = defb_resolve_schema( $block );

		$defaults = defb_collect_defaults( $block['_schema'] );
		if ( $defaults ) {
			$block['_defaults'] = $defaults;
		}

		return $block;
	}, $blocks );

	$asset = include DEFB_PATH . 'editor/build/index.asset.php';

	wp_enqueue_script(
		'defb-editor',
		DEFB_URL . 'editor/build/index.js',
		array_merge( $asset['dependencies'] ?? [], [ 'media-editor', 'image-edit', 'imgareaselect' ] ),
		$asset['version'] ?? DEFB_VERSION,
		true,
	);

	$google_key = apply_filters( 'defb_google_maps_key', null );

	wp_add_inline_script( 'defb-editor', 'var defineBlocks = ' . wp_json_encode( [
		'blocks'       => defb_strip_closures( $blocks ),
		'keys'         => [ 'googleMaps' => $google_key ],
		'fieldAliases' => defb_field_aliases(),
	] ) . ';', 'before' );

	if ( $google_key && defb_uses_field_type( $blocks, 'google-map' ) ) {
		wp_enqueue_script(
			'defb-google-maps',
			'https://maps.googleapis.com/maps/api/js?key=' . urlencode( $google_key ),
			[],
			'3',
			true,
		);
	}
} );

// ── Serialization helpers ───────────────────────────────────────────

function defb_strip_closures( mixed $data ): mixed {
	if ( ! is_array( $data ) ) {
		return $data;
	}
	foreach ( $data as $key => $value ) {
		if ( $value instanceof \Closure ) {
			unset( $data[ $key ] );
		} elseif ( is_array( $value ) ) {
			$data[ $key ] = defb_strip_closures( $value );
		}
	}
	return $data;
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Check whether any registered block uses a specific field type.
 */
function defb_uses_field_type( array $blocks, string ...$types ): bool {
	$check = static function ( array $fields ) use ( $types, &$check ): bool {
		foreach ( $fields as $field ) {
			if ( isset( $field['type'] ) && in_array( $field['type'], $types, true ) ) {
				return true;
			}
			if ( ! empty( $field['fields'] ) && $check( $field['fields'] ) ) {
				return true;
			}
			if ( ! empty( $field['tabs'] ) ) {
				foreach ( $field['tabs'] as $tab ) {
					if ( ! empty( $tab['fields'] ) && $check( $tab['fields'] ) ) {
						return true;
					}
				}
			}
		}
		return false;
	};

	foreach ( $blocks as $block ) {
		$schema = $block['_schema'] ?? [];

		foreach ( [ 'content', 'inspector-advanced' ] as $scope ) {
			if ( ! empty( $schema[ $scope ]['fields'] ) && $check( $schema[ $scope ]['fields'] ) ) {
				return true;
			}
		}

		foreach ( [ 'inspector', 'toolbar' ] as $scope ) {
			foreach ( ( $schema[ $scope ] ?? [] ) as $section ) {
				if ( ! empty( $section['fields'] ) && $check( $section['fields'] ) ) {
					return true;
				}
			}
		}
	}

	return false;
}
