---
title: "Site to site through SSH"
date: 2011-12-27
summary: "Move a site between hosts without downloading it first."
tags:
  - "DevOps"
legacyPath: /2011/12/27/site-to-site-through-ssh/
condensed: true
---

```bash
ssh old-host "tar czf - public_html" | ssh new-host "tar xzf -"
```

Skip the drag-and-drop FTP round trip and stream it host to host.
