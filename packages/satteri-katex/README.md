# satteri-katex

Satteri plugin scaffold for KaTeX support.

## Install

```sh
pnpm i @nullpinter/satteri-katex
```

## Usage

```ts
import { markdownToHtml } from "satteri";
import { katex } from "@nullpinter/satteri-katex";

const result = await markdownToHtml(markdown, {
 mdastPlugins: [katex()],
});

console.log(result.html);
```
