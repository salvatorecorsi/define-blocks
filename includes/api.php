<?php
/**
 * REST API endpoints.
 *
 * @package DefineBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', static function (): void {
	$ns = 'defb/v1';

	$check = static function ( WP_REST_Request $req ): bool|WP_Error {
		$post_id = $req->get_param( 'post_id' );
		if ( $post_id && ! current_user_can( 'edit_post', (int) $post_id ) ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to edit this post.', 'define-blocks' ), [ 'status' => 403 ] );
		}
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Insufficient permissions.', 'define-blocks' ), [ 'status' => 403 ] );
		}
		return true;
	};

	// ── Meta persistence ────────────────────────────────────────

	register_rest_route( $ns, '/meta', [
		'methods'             => WP_REST_Server::EDITABLE,
		'permission_callback' => $check,
		'args'                => [
			'post_id' => [ 'required' => true, 'sanitize_callback' => 'absint' ],
			'metas'   => [ 'required' => false, 'default' => [], 'sanitize_callback' => static fn( $v ) => is_array( $v ) ? $v : [] ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response|WP_Error {
			$post_id = (int) $req->get_param( 'post_id' );
			$post    = get_post( $post_id );

			if ( ! $post ) {
				return new WP_Error( 'not_found', __( 'Post not found.', 'define-blocks' ), [ 'status' => 404 ] );
			}

			$metas = $req->get_param( 'metas' );
			if ( ! is_array( $metas ) || empty( $metas ) ) {
				return rest_ensure_response( [ 'ok' => true ] );
			}

			$meta_fields = defb_meta_field_map();

			foreach ( $metas as $meta_key => $meta_value ) {
				$safe_key = sanitize_key( $meta_key );
				if ( ! $safe_key || ! isset( $meta_fields[ $safe_key ] ) ) {
					continue;
				}
				$safe_val = defb_sanitize_value( $meta_value, $meta_fields[ $safe_key ] );
				update_post_meta( $post_id, $safe_key, $safe_val );
			}

			return rest_ensure_response( [ 'ok' => true ] );
		},
	] );

	// ── Post search ─────────────────────────────────────────────

	register_rest_route( $ns, '/posts/search', [
		'methods'             => WP_REST_Server::EDITABLE,
		'permission_callback' => $check,
		'args'                => [
			's'         => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'post_type' => [ 'default' => 'all', 'sanitize_callback' => static fn( $v ) => is_array( $v ) ? array_map( 'sanitize_text_field', $v ) : sanitize_text_field( $v ) ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response {
			$search = sanitize_text_field( $req->get_param( 's' ) ?? '' );
			if ( ! $search ) {
				return rest_ensure_response( [] );
			}

			$types = (array) $req->get_param( 'post_type' );
			$types = array_filter(
				array_map( 'sanitize_text_field', $types ),
				static fn( $t ) => $t === 'all' || post_type_exists( $t ),
			);

			return rest_ensure_response( defb_query_posts( [
				's'              => $search,
				'post_type'      => $types ?: [ 'all' ],
				'posts_per_page' => 50,
				'post_status'    => 'publish',
			] ) );
		},
	] );

	// ── All posts by type ───────────────────────────────────────

	register_rest_route( $ns, '/posts/list', [
		'methods'             => WP_REST_Server::EDITABLE,
		'permission_callback' => $check,
		'args'                => [
			'post_type' => [ 'default' => 'post', 'sanitize_callback' => 'sanitize_text_field' ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response|WP_Error {
			$pt       = $req->get_param( 'post_type' );
			$excluded = [ 'attachment', 'custom_css', 'customize_changeset', 'nav_menu_item', 'oembed_cache', 'revision', 'user_request', 'wp_block' ];

			if ( $pt === 'all' ) {
				$pt = array_diff( get_post_types( [ 'public' => true ], 'names' ), $excluded );
			} elseif ( ! post_type_exists( $pt ) || in_array( $pt, $excluded, true ) ) {
				return new WP_Error( 'bad_type', __( 'Invalid post type.', 'define-blocks' ), [ 'status' => 400 ] );
			}

			return rest_ensure_response( defb_query_posts( [
				'post_type'      => $pt,
				'posts_per_page' => 100,
				'post_status'    => 'publish',
				'orderby'        => 'title',
				'order'          => 'ASC',
			] ) );
		},
	] );

	// ── Single post meta ────────────────────────────────────────

	register_rest_route( $ns, '/posts/meta', [
		'methods'             => WP_REST_Server::READABLE,
		'permission_callback' => $check,
		'args'                => [
			'post_id' => [ 'required' => true, 'sanitize_callback' => 'absint' ],
			'meta'    => [ 'required' => true, 'sanitize_callback' => 'sanitize_key' ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response|WP_Error {
			$pid = (int) $req->get_param( 'post_id' );
			if ( ! current_user_can( 'edit_post', $pid ) ) {
				return new WP_Error( 'forbidden', __( 'No access.', 'define-blocks' ), [ 'status' => 403 ] );
			}
			return rest_ensure_response( get_post_meta( $pid, $req->get_param( 'meta' ), true ) );
		},
	] );

	// ── Post preview data ───────────────────────────────────────

	register_rest_route( $ns, '/posts/preview/(?P<id>\d+)', [
		'methods'             => WP_REST_Server::READABLE,
		'permission_callback' => $check,
		'args'                => [
			'id' => [ 'sanitize_callback' => 'absint' ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response|WP_Error {
			$post = get_post( (int) $req->get_param( 'id' ) );
			if ( ! $post ) {
				return new WP_Error( 'not_found', __( 'Post not found.', 'define-blocks' ), [ 'status' => 404 ] );
			}
			return rest_ensure_response( [
				'ID'          => $post->ID,
				'post_title'  => esc_html( $post->post_title ),
				'post_type'   => $post->post_type,
				'post_status' => $post->post_status,
				'image'       => esc_url( (string) get_the_post_thumbnail_url( $post->ID ) ),
				'url'         => esc_url( get_permalink( $post->ID ) ),
			] );
		},
	] );

	// ── Server-side block render ────────────────────────────────

	register_rest_route( $ns, '/render', [
		'methods'             => WP_REST_Server::EDITABLE,
		'permission_callback' => $check,
		'args'                => [
			'blockName'  => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
			'post_id'    => [ 'required' => true, 'sanitize_callback' => 'absint' ],
			'attributes' => [ 'default' => [], 'sanitize_callback' => static fn( $v ) => is_array( $v ) ? $v : [] ],
			'content'    => [ 'default' => '', 'sanitize_callback' => 'wp_kses_post' ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response|WP_Error {
			$block_name = $req->get_param( 'blockName' );
			$content    = $req->get_param( 'content' ) ?? '';

			$blocks    = defb_registered();
			$block_def = $blocks[ $block_name ] ?? null;

			if ( ! $block_def ) {
				return new WP_Error( 'not_found', __( 'Block not found.', 'define-blocks' ), [ 'status' => 404 ] );
			}

			$attributes = defb_sanitize_attributes( $req->get_param( 'attributes' ) ?? [], $block_def );
			$html       = defb_render_output( $block_def, $attributes, $content );
			if ( $html === null ) {
				return new WP_Error( 'render_fail', __( 'Render failed.', 'define-blocks' ), [ 'status' => 500 ] );
			}

			return rest_ensure_response( '<div class="defb-preview">' . $html . '</div>' );
		},
	] );

	// ── File search by URL ──────────────────────────────────────

	register_rest_route( $ns, '/media/search', [
		'methods'             => WP_REST_Server::READABLE,
		'permission_callback' => $check,
		'args'                => [
			'url' => [ 'required' => true, 'sanitize_callback' => 'esc_url_raw' ],
		],
		'callback' => static function ( WP_REST_Request $req ): WP_REST_Response {
			$url = $req->get_param( 'url' );
			if ( strpos( $url, get_site_url() ) !== 0 ) {
				return rest_ensure_response( false );
			}

			$id = attachment_url_to_postid( $url );
			if ( ! $id ) {
				return rest_ensure_response( false );
			}

			$path = get_attached_file( $id );
			if ( ! $path || ! file_exists( $path ) ) {
				return rest_ensure_response( false );
			}

			return rest_ensure_response( [
				'id'   => $id,
				'url'  => $url,
				'name' => basename( $path ),
				'size' => size_format( filesize( $path ), 2 ),
				'mime' => wp_check_filetype( $path )['type'],
			] );
		},
	] );

} );

// ── Shared helpers ──────────────────────────────────────────────────

function defb_sanitize_deep( mixed $data ): mixed {
	return match ( true ) {
		is_array( $data )                     => array_map( __FUNCTION__, $data ),
		is_string( $data )                    => sanitize_text_field( $data ),
		is_numeric( $data ) || is_bool( $data ) => $data,
		default                               => '',
	};
}

function defb_sanitize_value( mixed $value, array $field ): mixed {
	$type = $field['type'] ?? 'text';

	return match ( $type ) {
		'text', 'text-with-parser', 'select', 'autocomplete'
			=> is_string( $value ) ? sanitize_text_field( $value ) : '',

		'textarea'
			=> is_string( $value ) ? sanitize_textarea_field( $value ) : '',

		'richtext'
			=> is_string( $value ) ? wp_kses_post( $value ) : '',

		'color'
			=> is_string( $value ) ? ( sanitize_hex_color( $value ) ?: '' ) : '',

		'url', 'video'
			=> is_string( $value ) ? esc_url_raw( $value ) : '',

		'checkbox'
			=> (bool) $value,

		'range'
			=> is_numeric( $value ) ? (float) $value : 0,

		'date', 'time', 'datetime'
			=> is_string( $value ) ? sanitize_text_field( $value ) : '',

		'media'
			=> is_array( $value ) ? defb_sanitize_object( $value, [
				'id' => 'absint', 'url' => 'esc_url_raw',
				'alt' => 'sanitize_text_field', 'title' => 'sanitize_text_field',
			] ) : [],

		'file'
			=> is_array( $value ) ? defb_sanitize_object( $value, [
				'id' => 'absint', 'url' => 'esc_url_raw', 'name' => 'sanitize_text_field',
				'size' => 'sanitize_text_field', 'mime' => 'sanitize_text_field',
			] ) : [],

		'link'
			=> is_array( $value ) ? defb_sanitize_object( $value, [
				'url' => 'esc_url_raw', 'title' => 'sanitize_text_field',
				'opensInNewTab' => 'boolval',
			] ) : [],

		'google-map', 'osm-map'
			=> is_array( $value ) ? defb_sanitize_object( $value, [
				'lat' => 'floatval', 'lng' => 'floatval',
				'formatted_address' => 'sanitize_text_field', 'query' => 'sanitize_text_field',
			] ) : [],

		'gallery'
			=> is_array( $value ) ? array_values( array_map(
				static fn( $item ) => is_array( $item ) ? defb_sanitize_object( $item, [
					'id' => 'absint', 'url' => 'esc_url_raw',
					'alt' => 'sanitize_text_field', 'title' => 'sanitize_text_field',
				] ) : [],
				$value,
			) ) : [],

		'post-selector'
			=> is_array( $value ) ? array_values( array_map(
				static fn( $item ) => is_array( $item ) ? defb_sanitize_object( $item, [
					'id' => 'absint', 'title' => 'sanitize_text_field',
					'permalink' => 'esc_url_raw', 'thumbnail' => 'esc_url_raw',
				] ) : [],
				$value,
			) ) : [],

		'multi-select', 'multi-autocomplete', 'chips', 'taxonomy'
			=> is_array( $value ) ? array_values( array_map(
				static fn( $item ) => is_array( $item ) ? defb_sanitize_object( $item, [
					'value' => 'sanitize_text_field', 'label' => 'sanitize_text_field',
				] ) : [],
				$value,
			) ) : [],

		'repeater'
			=> defb_sanitize_repeater( $value, $field ),

		'innerblocks', 'tabpanels', 'group', 'title', 'hidden', 'value'
			=> $value,

		default => defb_sanitize_deep( $value ),
	};
}

function defb_sanitize_object( array $data, array $rules ): array {
	$out = [];
	foreach ( $data as $key => $value ) {
		$sanitizer   = $rules[ $key ] ?? null;
		$out[ $key ] = $sanitizer ? $sanitizer( $value ) : defb_sanitize_deep( $value );
	}
	return $out;
}

function defb_sanitize_repeater( mixed $value, array $field ): array {
	if ( ! is_array( $value ) ) {
		return [];
	}

	$sub_fields = isset( $field['fields'] ) && is_array( $field['fields'] )
		? defb_flatten_fields( $field['fields'] )
		: [];

	return array_values( array_map( static function ( $item ) use ( $sub_fields ): array {
		if ( ! is_array( $item ) ) {
			return [];
		}

		$out = [];
		foreach ( $item as $key => $val ) {
			if ( $key === '_defb_id' ) {
				$out[ $key ] = sanitize_text_field( $val );
				continue;
			}
			$sub        = $sub_fields[ $key ] ?? null;
			$out[ $key ] = $sub ? defb_sanitize_value( $val, $sub ) : defb_sanitize_deep( $val );
		}
		return $out;
	}, $value ) );
}

function defb_sanitize_attributes( array $attrs, array $block ): array {
	$schema    = defb_resolve_schema( $block );
	$field_map = defb_schema_field_map( $schema );

	$out = [];
	foreach ( $attrs as $key => $value ) {
		$field      = $field_map[ $key ] ?? null;
		$out[ $key ] = $field ? defb_sanitize_value( $value, $field ) : defb_sanitize_deep( $value );
	}

	return $out;
}

function defb_flatten_fields( array $fields ): array {
	$map = [];

	foreach ( $fields as $name => $field ) {
		if ( ! is_array( $field ) ) {
			continue;
		}

		$type = $field['type'] ?? '';

		if ( $type === 'group' && ! empty( $field['fields'] ) ) {
			$map = array_merge( $map, defb_flatten_fields( $field['fields'] ) );
			continue;
		}
		if ( $type === 'tabpanels' && ! empty( $field['tabs'] ) ) {
			foreach ( $field['tabs'] as $tab ) {
				if ( ! empty( $tab['fields'] ) ) {
					$map = array_merge( $map, defb_flatten_fields( $tab['fields'] ) );
				}
			}
			continue;
		}

		$map[ $name ] = $field;
	}

	return $map;
}

function defb_schema_field_map( array $schema ): array {
	$map = [];

	foreach ( [ 'content', 'inspector-advanced' ] as $scope ) {
		if ( ! empty( $schema[ $scope ]['fields'] ) ) {
			$map = array_merge( $map, defb_flatten_fields( $schema[ $scope ]['fields'] ) );
		}
	}

	foreach ( [ 'inspector', 'toolbar' ] as $scope ) {
		foreach ( ( $schema[ $scope ] ?? [] ) as $section ) {
			if ( ! empty( $section['fields'] ) ) {
				$map = array_merge( $map, defb_flatten_fields( $section['fields'] ) );
			}
		}
	}

	return $map;
}

function defb_meta_field_map(): array {
	static $map = null;
	if ( $map !== null ) {
		return $map;
	}

	$map  = [];
	$walk = static function ( array $fields ) use ( &$map, &$walk ): void {
		foreach ( $fields as $field ) {
			if ( ! is_array( $field ) ) {
				continue;
			}
			if ( ! empty( $field['saveInMeta'] ) && is_string( $field['saveInMeta'] ) ) {
				$map[ $field['saveInMeta'] ] = $field;
			}
			if ( ! empty( $field['fields'] ) ) {
				$walk( $field['fields'] );
			}
			if ( ! empty( $field['tabs'] ) ) {
				foreach ( $field['tabs'] as $tab ) {
					if ( ! empty( $tab['fields'] ) ) {
						$walk( $tab['fields'] );
					}
				}
			}
		}
	};

	foreach ( defb_registered() as $block ) {
		$schema = defb_resolve_schema( $block );

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
	}

	return $map;
}

function defb_query_posts( array $args ): array {
	$query = new WP_Query( $args );
	$out   = [];

	foreach ( $query->posts as $p ) {
		$type_obj = get_post_type_object( $p->post_type );
		$out[]    = [
			'id'        => $p->ID,
			'title'     => esc_html( $p->post_title ),
			'type'      => $p->post_type,
			'typeLabel' => $type_obj ? $type_obj->labels->singular_name : ucfirst( $p->post_type ),
			'permalink' => esc_url( get_permalink( $p->ID ) ),
			'thumbnail' => esc_url( (string) get_the_post_thumbnail_url( $p->ID, 'thumbnail' ) ),
		];
	}

	return $out;
}
