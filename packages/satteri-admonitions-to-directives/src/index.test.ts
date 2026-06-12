import { expect, test } from "vitest";
import type { MdastNode } from "satteri";
import { admonitionsToDirectives } from "./index.js";

type BlockquoteNode = Extract<MdastNode, { type: "blockquote" }>;

const convert = (node: BlockquoteNode, options?: Parameters<typeof admonitionsToDirectives>[0]) =>
  admonitionsToDirectives(options).blockquote?.(node, undefined as never);

test("converts github note alert to container directive", () => {
  expect(
    convert({
      type: "blockquote",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "[!NOTE]" }],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "Useful context." }],
        },
      ],
    }),
  ).toEqual({
    type: "containerDirective",
    name: "note",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Useful context." }],
      },
    ],
  });
});

test("preserves text after declaration in the first text node", () => {
  expect(
    convert({
      type: "blockquote",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "[!WARNING]\nFirst line\nsecond line with " },
            {
              type: "strong",
              children: [{ type: "text", value: "formatting" }],
            },
            { type: "text", value: "." },
          ],
        },
      ],
    }),
  ).toEqual({
    type: "containerDirective",
    name: "warning",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", value: "First line\nsecond line with " },
          {
            type: "strong",
            children: [{ type: "text", value: "formatting" }],
          },
          { type: "text", value: "." },
        ],
      },
    ],
  });
});

test("uses default mapping from upstream package", () => {
  const important = convert({
    type: "blockquote",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "[!IMPORTANT]" }],
      },
    ],
  });
  const caution = convert({
    type: "blockquote",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "[!CAUTION]" }],
      },
    ],
  });

  expect(important).toEqual({
    type: "containerDirective",
    name: "info",
    children: [],
  });
  expect(caution).toEqual({
    type: "containerDirective",
    name: "danger",
    children: [],
  });
});

test("keeps non-alert blockquotes unchanged", () => {
  expect(
    convert({
      type: "blockquote",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Plain quote." }],
        },
      ],
    }),
  ).toBeUndefined();
});

test("supports custom mapping", () => {
  expect(
    convert(
      {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "[!TIP]\nTry this." }],
          },
        ],
      },
      {
        mapping: {
          NOTE: "callout-note",
          TIP: "callout-tip",
          IMPORTANT: "callout-important",
          WARNING: "callout-warning",
          CAUTION: "callout-caution",
        },
      },
    ),
  ).toEqual({
    type: "containerDirective",
    name: "callout-tip",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Try this." }],
      },
    ],
  });
});
