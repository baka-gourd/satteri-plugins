# satteri-extended-table

Satteri plugin for the extended table syntax implemented by
`remark-extended-table`.

## Install

```sh
pnpm i @nullpinter/satteri-extended-table
```

## Usage

Enable GFM table parsing and register the plugin in `mdastPlugins`:

```ts
import { markdownToHtml } from "satteri";
import { extendedTable } from "satteri-extended-table";

const result = await markdownToHtml(markdown, {
 features: { gfm: true },
 mdastPlugins: [extendedTable({ colspanWithEmpty: true })],
});

console.log(result.html);
```

## Syntax

The plugin follows `remark-extended-table` semantics:

- `^` merges with the cell above it and creates a `rowspan`.
- `>` merges with the cell to the right and creates a `colspan`.
- Empty cells can merge with the left cell when `colspanWithEmpty` is enabled.

Example:

```md
| a | b |
|---|---|
| 1 | 2 |
| ^ | 3 |
```

Output:

```html
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
</tr>
</thead>
<tbody>
<tr>
<td rowspan="2">1</td>
<td>2</td>
</tr>
<tr>
<td>3</td>
</tr>
</tbody>
</table>
```

## Notes

- This is an MDAST plugin. Use it in `mdastPlugins`, not `hastPlugins`.
- `features.gfm` must be enabled so Satteri parses Markdown tables before this
  plugin runs.
