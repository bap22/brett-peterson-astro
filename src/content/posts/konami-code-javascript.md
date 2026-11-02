---
title: "Konami code in JavaScript"
date: 2013-02-10
summary: "Hide an Easter egg on your site."
tags:
  - "JavaScript"
  - "Fun"
legacyPath: /2013/02/10/konami-code-javascript/
condensed: true
---

Listen for keystrokes, keep the last ten, and compare against ↑ ↑ ↓ ↓ ← → ← → B A. The 2013 version used jQuery and popped open a window. Here's a modern take, and yes, it works on this site:

```js
const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let keys = [];
addEventListener('keydown', (e) => {
  keys = [...keys, e.key].slice(-code.length);
  if (keys.join() === code.join()) party();
});
```
