---
title: "Calculate molecular weight from a formula"
date: 2014-08-09
summary: "Parsing C11H15BClNO2 into a molecular weight."
tags:
  - "PHP"
  - "Symfony"
  - "Doctrine"
legacyPath: /2014/08/09/calculate-molecular-weight-based-on-formula/
condensed: true
---

A client needed molecular weights shown next to compounds. Element weights lived in a Doctrine table; the function splits a formula like `C11H15BClNO2` with a regex into element and count pairs, looks up each weight, multiplies, sums, and rounds to two places.

```php
preg_match_all('/([A-Z][a-z]?)(\d*)/', $formula, $m, PREG_SET_ORDER);
```
