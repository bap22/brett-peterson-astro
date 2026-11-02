---
title: "WordPress pagination"
date: 2015-08-27
summary: "Paginating a custom WP_Query on a page template."
tags:
  - "WordPress"
  - "PHP"
legacyPath: /2015/08/27/wordpress-pagination/
condensed: true
---

Pagination on a custom page template trips people up because the main query doesn't know about your loop. Three moves fix it:

1. Read the current page from the `paged` query var (fall back to `1`).
2. Pass it into your `WP_Query` args along with `posts_per_page`.
3. Temporarily swap your query into the global `$wp_query` so the pagination helpers see it, then restore it.

```php
$paged = max( 1, get_query_var( 'paged' ) );
$query = new WP_Query( [
  'post_type'      => 'your_type',
  'posts_per_page' => 10,
  'paged'          => $paged,
] );

$original = $GLOBALS['wp_query'];
$GLOBALS['wp_query'] = $query;
// ...loop...
the_posts_pagination();
$GLOBALS['wp_query'] = $original;
wp_reset_postdata();
```
