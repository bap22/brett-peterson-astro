---
title: "WordPress 301 redirects with parameters"
date: 2012-07-20
summary: "Query-string redirects after a ZenCart migration."
tags:
  - "WordPress"
  - "Apache"
  - "SEO"
legacyPath: /2012/07/20/wordpress-301-redirects-with-parameters/
condensed: true
---

`Redirect 301` ignores query strings, so old ZenCart URLs like `index.php?main_page=product_info&products_id=12` fell through after the move to WordPress. Match them with `RewriteCond %{QUERY_STRING}` and a `RewriteRule` instead.
