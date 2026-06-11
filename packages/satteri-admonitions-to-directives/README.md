# satteri-admonitions-to-directives

Satteri plugin that converts GitHub alert blockquotes to container directive
nodes.

```md
> [!NOTE]
> Useful context.
```

becomes the mdast equivalent of:

```md
:::note
Useful context.
:::
```

## Usage

```ts
import { markdownToHtml } from "satteri";
import { admonitionsToDirectives } from "@nullpinter/satteri-admonitions-to-directives";

const result = markdownToHtml(markdown, {
 mdastPlugins: [admonitionsToDirectives()],
});
```

## Options

Pass `mapping` to customize directive names:

```ts
admonitionsToDirectives({
 mapping: {
  NOTE: "note",
  TIP: "tip",
  IMPORTANT: "info",
  WARNING: "warning",
  CAUTION: "danger",
 },
});
```
