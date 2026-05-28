=== Define Blocks ===
Contributors: salvatorecorsi
Tags: blocks, gutenberg, custom blocks, block editor, php blocks
Requires at least: 6.3
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Define native Gutenberg blocks with pure PHP. No JavaScript, no build step.

== Description ==

You know the drill: you need a custom block, so you set up a `block.json`, a webpack config, write some React, wire up attributes, build it, debug it, repeat. For a text field and a color picker.

Define Blocks skips all of that. You call one PHP function and describe what fields you want:

`add_action( 'init', function () {
    define_block_type( 'myplugin/hero', [
        'title'  => 'Hero',
        'icon'   => 'cover-image',
        'schema' => [
            [
                'scope'  => 'content',
                'fields' => [
                    'heading' => [ 'type' => 'richtext', 'label' => 'Heading' ],
                    'image'   => [ 'type' => 'media',    'label' => 'Background' ],
                ],
            ],
            [
                'scope' => 'inspector',
                'panel' => 'Settings',
                'fields' => [
                    'color'   => [ 'type' => 'color', 'label' => 'Overlay' ],
                    'opacity' => [ 'type' => 'range', 'label' => 'Opacity', 'min' => 0, 'max' => 100 ],
                ],
            ],
        ],
        'render' => function ( $attributes, $content, $block ) {
            // return your HTML
        },
    ] );
} );`

The plugin reads your schema and builds the editor UI: content area fields, inspector panels, toolbar buttons. You get a real Gutenberg block registered with `register_block_type()` under the hood, with all the standard supports (alignment, colors, spacing). Your theme or plugin just ships PHP.

Here's what's in the box:

* 30+ field types -- richtext, media, gallery, repeater, tabs, color, range, post selector, maps, and others
* Fields go where you say: content, inspector, toolbar, advanced panel
* Conditional visibility -- hide or show fields based on other fields, with simple arrays or full expressions (`layout == "grid" && columns > 2`)
* `saveInMeta` writes any field to post_meta so you can query it with `WP_Query`
* Server-side preview right in the editor
* Repeater with drag & drop, min/max, nested fields
* You can register your own field types from a separate plugin

Docs and source: [GitHub](https://github.com/salvatorecorsi/define-blocks).

== Installation ==

1. Upload `define-blocks` to `/wp-content/plugins/`.
2. Activate it.
3. Call `define_block_type()` on the `init` hook (or earlier) from your theme or plugin.

No npm. No webpack. No node_modules folder.

== Frequently Asked Questions ==

= Do I have to write JavaScript? =

No. The block schema is PHP, the render is PHP. The plugin handles the React side.

= Where do I call define_block_type()? =

On the `init` hook, or any time before it. Registrations are collected at `init` priority 99, so a block registered after that point won't show up. Calling it directly from a plugin's main file or a theme's `functions.php` works; if you wrap it in a hook, use `init`.

= Does this break other blocks? =

No. Define Blocks registers normal WordPress blocks. They show up in the inserter alongside everything else.

= How do I get field values in the render callback? =

They're all in `$attributes['values']`:

`'render' => function ( $attributes, $content, $block ) {
    $values  = $attributes['values'] ?? [];
    $heading = $values['heading'] ?? '';
    return '<h1>' . esc_html( $heading ) . '</h1>';
},`

You can also pass a function name as a string (`'render' => 'myplugin_hero_render'`), or skip `render` entirely -- the plugin will look for a function matching the block name (`myplugin/hero` tries `myplugin_hero_render()`).

= Can I query posts by a field value? =

Yes. Put `'saveInMeta' => 'your_meta_key'` on the field. Its value gets saved as post_meta on every save, so `get_post_meta()` and `WP_Query` work as expected.

= Can I read a block's values from PHP outside the render? =

Yes:

`$values  = defb_get_block( $post_id, 'myplugin/hero' );
$heading = defb_get_block( $post_id, 'myplugin/hero', 'heading' );
$slides  = defb_get_blocks( $post_id, 'myplugin/slide' );`

= What field types are there? =

text, text-with-parser, textarea, richtext, select, multi-select, autocomplete, multi-autocomplete, chips, checkbox, color, range, url, link, media, file, gallery, video, date, time, datetime, post-selector, taxonomy, repeater, group, tabpanels, innerblocks, google-map, osm-map, toolbar-toggle, toolbar-select, toolbar-dropdown, hidden, value, title. Most have aliases -- `image` works for `media`, `toggle` for `checkbox`, `tabs` for `tabpanels`, and so on.

= Can I make my own field type? =

Yes. In your plugin call `defb_register_custom_field( __FILE__ )`, then in JS register a React component on `window.DefineBlocks.Extensions['your-type']`. The [docs](https://github.com/salvatorecorsi/define-blocks) have the details.

= How do conditional fields work? =

A field can have a `condition` that references another field. Array form: `'condition' => [ 'layout' => 'grid' ]`. Or a string for more complex logic: `'condition' => 'show_cta == true && layout != "minimal"'`.

== Screenshots ==

1. The PHP schema on the left, the generated editor UI on the right -- each field maps directly to the block interface
2. The render callback and its frontend output side by side

== Upgrade Notice ==

= 1.0.0 =
Initial release.

== Changelog ==

= 1.0.0 =
* Initial release.
