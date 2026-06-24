import { expect, test } from "vitest";
import { defineMdastPlugin, markdownToHtml, mdxToJs } from "satteri";
import { isSectionNode, sectionize, type SectionizeOptions } from "./index.js";

const process = async (markdown: string, options?: SectionizeOptions) => {
  const result = await markdownToHtml(markdown, {
    mdastPlugins: [sectionize(options)],
  });

  return result.html.trim();
};

test("sectionize", async () => {
  const document = `# Heading 1

Some text under heading 1.

## Heading 1.1

Additional text.

## Heading 1.2

_More_ additional text.

### Heading 1.2.1

> Blockquote

Text.

##### Bad heading

Lorem ipsum.

### Heading 1.2.2

Dolor sit amet.

# Heading 2

Another top level heading.

###### Another bad heading

When will it end?`;

  const html = await process(document);

  expect(html).toBe(`<section><h1>Heading 1</h1><p>Some text under heading 1.</p><section><h2>Heading 1.1</h2><p>Additional text.</p></section><section><h2>Heading 1.2</h2><p><em>More</em> additional text.</p><section><h3>Heading 1.2.1</h3><blockquote>
<p>Blockquote</p>
</blockquote><p>Text.</p><section><h5>Bad heading</h5><p>Lorem ipsum.</p></section></section><section><h3>Heading 1.2.2</h3><p>Dolor sit amet.</p></section></section></section>
<section><h1>Heading 2</h1><p>Another top level heading.</p><section><h6>Another bad heading</h6><p>When will it end?</p></section></section>`);
});

test("sectionize with orphan nodes at start", async () => {
  const document = `Some orphan text.

> An orphan blockquote.

## Heading 1

Some text under heading 1.

## Heading 2

Additional text.`;

  const html = await process(document);

  expect(html).toBe(`<p>Some orphan text.</p>
<blockquote>
<p>An orphan blockquote.</p>
</blockquote>
<section><h2>Heading 1</h2><p>Some text under heading 1.</p></section>
<section><h2>Heading 2</h2><p>Additional text.</p></section>`);
});

test("respects maxDepth", async () => {
  const html = await process(
    `# Heading 1

## Heading 2

### Heading 3

Text.`,
    { maxDepth: 2 },
  );

  expect(html).toBe(
    `<section><h1>Heading 1</h1><section><h2>Heading 2</h2><h3>Heading 3</h3><p>Text.</p></section></section>`,
  );
});

test("keeps mdx esm outside sections", async () => {
  const result = await mdxToJs(
    `# Heading 1

Text.

export const value = 1

## Heading 2

More text.`,
    { mdastPlugins: [sectionize()] },
  );

  expect(result.code).toContain("export const value = 1");
  expect(result.code.match(/_components\.section/g)).toHaveLength(2);
});

test("sectionizes headings in nested parents", async () => {
  const html = await process(`> # Heading 1
>
> Text.
>
> ## Heading 2
>
> More text.`);

  expect(html).toBe(`<blockquote>
<section><h1>Heading 1</h1><p>Text.</p><section><h2>Heading 2</h2><p>More text.</p></section></section>
</blockquote>`);
});

test("preserves node identity for later plugins", async () => {
  const rewriteText = defineMdastPlugin({
    name: "rewrite-text",
    text(node, ctx) {
      if (node.value === "Before") {
        ctx.setProperty(node, "value", "After");
      }
    },
  });

  const result = await markdownToHtml("# Heading\n\nBefore", {
    mdastPlugins: [sectionize(), rewriteText],
  });

  expect(result.html.trim()).toBe("<section><h1>Heading</h1><p>After</p></section>");
});

test("leaves documents without headings unchanged", async () => {
  expect(await process("Plain text.")).toBe("<p>Plain text.</p>");
});

test("does not expose generated sections as blockquotes", async () => {
  let blockquotes = 0;

  const countBlockquotes = defineMdastPlugin({
    name: "count-blockquotes",
    blockquote() {
      blockquotes++;
    },
  });

  await markdownToHtml("# Heading\n\nText.", {
    mdastPlugins: [sectionize(), countBlockquotes],
  });

  expect(blockquotes).toBe(0);
});

test("stores section heading depth in node data", async () => {
  const depths: unknown[] = [];

  const collectDepths = defineMdastPlugin({
    name: "collect-section-depths",
    containerDirective(node) {
      if (isSectionNode(node)) {
        depths.push(node.data.depth);
      }
    },
  });

  await markdownToHtml("# Heading 1\n\n## Heading 2", {
    mdastPlugins: [sectionize(), collectDepths],
  });

  expect(depths).toEqual([1, 2]);
});
