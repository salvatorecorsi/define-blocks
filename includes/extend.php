<?php
/**
 * Custom field extension API.
 *
 * Lets third-party plugins register new field-type components
 * for the block editor by providing a built JS bundle.
 *
 * Usage:
 *   defb_register_custom_field( __FILE__ );
 *
 * Expects build/index.js (and optionally build/style-index.css)
 * relative to the caller's directory.
 *
 * @package DefineBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function defb_register_custom_field( string $entry_file ): void {
	$base_url = plugin_dir_url( $entry_file );
	$base_dir = plugin_dir_path( $entry_file );
	$handle   = 'defb-cf-' . basename( dirname( $entry_file ) );

	add_action( 'admin_enqueue_scripts', static function () use ( $base_url, $base_dir, $handle ): void {
		$screen = get_current_screen();
		if ( ! $screen || ! $screen->is_block_editor ) {
			return;
		}

		$js_path = $base_dir . 'build/index.js';
		if ( ! file_exists( $js_path ) ) {
			return;
		}

		wp_enqueue_script(
			$handle,
			$base_url . 'build/index.js',
			[ 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor' ],
			(string) filemtime( $js_path ),
			true,
		);

		$css_path = $base_dir . 'build/style-index.css';
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				$handle,
				$base_url . 'build/style-index.css',
				[],
				(string) filemtime( $css_path ),
			);
		}
	} );
}
