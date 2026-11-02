---
title: "suPHP permissions"
date: 2011-11-28
summary: "Why your site suddenly cannot write files."
tags:
  - "PHP"
  - "Apache"
legacyPath: /2011/11/28/suphp/
condensed: true
---

Under suPHP, PHP runs as the file owner, so ownership and permissions decide whether uploads and caches work. Files 644, directories 755, owned by the account user.
