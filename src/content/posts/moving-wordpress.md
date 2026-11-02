---
title: "Moving WordPress?"
date: 2012-04-03
summary: "Update site URLs when changing domains."
tags:
  - "WordPress"
  - "MySQL"
legacyPath: /2012/04/03/moving-wordpress/
condensed: true
---

```sql
UPDATE wp_options SET option_value = REPLACE(option_value, 'old.com', 'new.com') WHERE option_name IN ('home','siteurl');
UPDATE wp_posts SET guid = REPLACE(guid, 'old.com', 'new.com');
UPDATE wp_posts SET post_content = REPLACE(post_content, 'old.com', 'new.com');
```

Watch your table prefix, and watch serialized data in options. Today, `wp search-replace` handles both.
