<?php
/**
 * Plugin Name:       Define Blocks
 * Plugin URI:        https://github.com/salvatorecorsi/define-blocks
 * Description:       Define native blocks with pure PHP.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      8.1
 * Author:            Salvatore Corsi
 * Author URI:        https://salvatorecorsi.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       define-blocks
 * Domain Path:       /languages
 *
 * Copyright (C) 2026 Salvatore Corsi
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', static function (): void {
	load_plugin_textdomain( 'define-blocks', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
} );

add_action( 'enqueue_block_editor_assets', static function (): void {
	wp_set_script_translations(
		'defb-editor',
		'define-blocks',
		plugin_dir_path( __FILE__ ) . 'languages'
	);
}, 100 );

// ── Field persistence on save ──────────────────────────────────────

add_action( 'save_post', static function ( int $post_id, \WP_Post $post ): void {
	if ( wp_is_post_revision( $post_id ) || defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	$registered = defb_registered( $post_id );
	if ( empty( $registered ) ) {
		return;
	}

	$parsed = parse_blocks( $post->post_content );
	defb_process_save( $parsed, $registered, $post_id );
}, 10, 2 );

function defb_process_save( array $blocks, array $registered, int $post_id ): void {
	foreach ( $blocks as $block ) {
		$name = $block['blockName'] ?? '';

		if ( isset( $registered[ $name ] ) ) {
			$values = $block['attrs']['values'] ?? [];
			$schema = defb_resolve_schema( $registered[ $name ] );

			defb_run_field_saves( $schema, $values, $post_id );
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			defb_process_save( $block['innerBlocks'], $registered, $post_id );
		}
	}
}

function defb_run_field_saves( array $schema, array $values, int $post_id ): void {
	$process = static function ( array $fields ) use ( $values, $post_id, &$process ): void {
		foreach ( $fields as $key => $field ) {
			$val = $values[ $key ] ?? null;

			if ( ! empty( $field['validate'] ) && is_callable( $field['validate'] ) ) {
				$valid = call_user_func( $field['validate'], $val, $key, $post_id );
				if ( $valid === false || is_string( $valid ) ) {
					continue;
				}
			}

			if ( ! empty( $field['saveInMeta'] ) && is_string( $field['saveInMeta'] ) ) {
				update_post_meta( $post_id, $field['saveInMeta'], defb_sanitize_value( $val, $field ) );
			}

			if ( ! empty( $field['saveCallback'] ) && is_callable( $field['saveCallback'] ) ) {
				call_user_func( $field['saveCallback'], $val, $post_id, $key );
			}

			if ( ! empty( $field['tabs'] ) ) {
				foreach ( $field['tabs'] as $tab ) {
					if ( ! empty( $tab['fields'] ) ) {
						$process( $tab['fields'] );
					}
				}
			}

			if ( ! empty( $field['fields'] ) ) {
				$process( $field['fields'] );
			}
		}
	};

	foreach ( [ 'content', 'inspector-advanced' ] as $scope ) {
		if ( ! empty( $schema[ $scope ]['fields'] ) ) {
			$process( $schema[ $scope ]['fields'] );
		}
	}

	foreach ( [ 'inspector', 'toolbar' ] as $scope ) {
		foreach ( ( $schema[ $scope ] ?? [] ) as $section ) {
			if ( ! empty( $section['fields'] ) ) {
				$process( $section['fields'] );
			}
		}
	}
}

// ── Includes ───────────────────────────────────────────────────────

require_once plugin_dir_path( __FILE__ ) . 'includes/constants.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/register.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/render.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/enqueue.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/api.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/extend.php';