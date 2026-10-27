---
"@nullpinter/satteri-admonitions-to-directives": minor
"@nullpinter/satteri-extended-table": minor
"@nullpinter/satteri-katex": minor
"@nullpinter/satteri-sectionize": minor
---

Require Satteri ^0.11.5 across all plugins, allowing compatible 0.11 patch updates. Remove the KaTeX namespace workaround now that upstream preserves xmlns correctly, and migrate sectionize to ctx.setField.
