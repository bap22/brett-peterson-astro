---
title: "Block direct access to WordPress comments"
date: 2012-02-16
summary: "Stop bots posting to wp-comments-post.php."
tags:
  - "WordPress"
  - "Apache"
  - "Security"
legacyPath: /2012/02/16/direct-access-to-comments/
condensed: true
---

Most comment spam skips your form and POSTs straight to `wp-comments-post.php`. An `.htaccess` rule that requires a same-site referrer and a user agent stops most of it.
