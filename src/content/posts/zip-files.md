---
title: "Zip files"
date: 2014-08-09
summary: "A small PHP helper for zipping a set of files."
tags:
  - "PHP"
  - "Symfony"
legacyPath: /2014/08/09/zip-files/
condensed: true
---

A static helper from a Symfony project: take an array of paths, keep the ones that exist, add each to a `ZipArchive` by basename, and return whether the archive was written. Worth adding real error handling before you trust it in production.
