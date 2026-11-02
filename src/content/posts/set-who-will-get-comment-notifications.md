---
title: "Choose who gets WordPress comment notifications"
date: 2013-01-28
summary: "Roles, .htaccess spam filtering, and targeted notifications."
tags:
  - "WordPress"
legacyPath: /2013/01/28/set-who-will-get-comment-notifications/
condensed: true
---

I love WordPress. I don't love comment emails. The fix: create a moderator role with the Members plugin, block comment POSTs with an empty user agent or an off-site referrer in `.htaccess`, turn off default notifications, and email only the users or roles you choose from `functions.php`.
