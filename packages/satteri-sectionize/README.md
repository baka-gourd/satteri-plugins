# @nullpinter/satteri-sectionize

Satteri plugin for wrapping heading sections in `<section>` elements.

## Usage

```ts
import { sectionize } from "@nullpinter/satteri-sectionize";
import { markdownToHtml } from "satteri";

const result = await markdownToHtml(markdown, {
  mdastPlugins: [sectionize()],
});
```

The plugin mirrors `remark-sectionize`: headings are wrapped together with the
following sibling nodes until the next heading at the same or a higher level.

It requires Satteri 0.9.2. The implementation uses the parent and sibling index
APIs introduced in Satteri 0.9.0.

## Options

```ts
const result = await markdownToHtml(markdown, {
  mdastPlugins: [sectionize({ maxDepth: 4 })],
});
```

- `maxDepth` controls the deepest heading level that starts a section and
  defaults to `6`.

MDX ESM declarations such as `export` remain outside section elements and end
the preceding section, matching `remark-sectionize`.

## Generated nodes

Satteri cannot encode custom MDAST node types, so generated sections use
`containerDirective` nodes with this shape:

```ts
{
  type: "containerDirective",
  name: "section",
  data: {
    hName: "section",
    depth: 2,
  },
  children: [],
}
```

`data.hName` renders the node as `<section>`, while `data.depth` records the
heading depth that opened it. The implementation does not use blockquote nodes,
so plugins that visit blockquotes will only receive actual Markdown quotes.

## Plugin order

Place plugins that add, remove, or change headings before `sectionize()`.
Plugins that consume the generated section containers should run after it:

```ts
mdastPlugins: [rewriteHeadings(), sectionize(), consumeSections()]
```

Later plugins can identify generated sections by checking both
`node.type === "containerDirective"` and `node.name === "section"`, or use the
exported type guard:

```ts
import { isSectionNode } from "@nullpinter/satteri-sectionize";

if (isSectionNode(node)) {
  console.log(node.data.depth);
}
```
