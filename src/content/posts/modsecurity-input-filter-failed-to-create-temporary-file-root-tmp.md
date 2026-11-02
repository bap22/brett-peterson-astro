---
title: "Magento cannot upload image"
date: 2012-03-23
summary: "A vague upload error caused by ModSecurity."
tags:
  - "Magento"
  - "Apache"
legacyPath: /2012/03/23/modsecurity-input-filter-failed-to-create-temporary-file-root-tmp/
condensed: true
---

Magento's image uploader threw a generic HTML error. The real cause was ModSecurity failing to write its temporary file. Point its tmp directory somewhere writable and uploads come back.
