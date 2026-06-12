import { toHtml } from "hast-util-to-html";
import { fromMarkdown } from "mdast-util-from-markdown";
import {
  extendedTableFromMarkdown,
  extendedTableHandlers,
  type extendedTableFromMarkdownOptions,
} from "mdast-util-extended-table";
import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import { toHast } from "mdast-util-to-hast";
import { extendedTable as micromarkExtendedTable } from "micromark-extension-extended-table";
import { gfmTable } from "micromark-extension-gfm-table";
import { defineMdastPlugin, type MdastNode, type MdastPluginDefinition } from "satteri";

export type ExtendedTableOptions = extendedTableFromMarkdownOptions;

type TableNode = Extract<MdastNode, { type: "table" }>;

function sliceSource(source: string, node: TableNode) {
  if (!node.position) {
    return undefined;
  }
  return source.slice(node.position.start.offset, node.position.end.offset);
}

function renderExtendedTable(markdown: string, options?: ExtendedTableOptions) {
  const tree = fromMarkdown(markdown, {
    extensions: [gfmTable(), micromarkExtendedTable],
    mdastExtensions: [gfmTableFromMarkdown(), extendedTableFromMarkdown(options)],
  });

  const hast = toHast(tree, {
    handlers: extendedTableHandlers,
  });

  return toHtml(hast);
}

/**
 * Supports the extended table markers implemented by remark-extended-table:
 *
 * - `^` merges with the upper cell (`rowspan`)
 * - `>` merges with the right cell (`colspan`)
 * - `||` can merge with the left cell when `colspanWithEmpty` is enabled
 */
export function extendedTable(options?: ExtendedTableOptions): MdastPluginDefinition {
  return defineMdastPlugin({
    name: "extended-table",
    table(node, ctx) {
      const markdown = sliceSource(ctx.source, node);
      if (!markdown) {
        return;
      }

      return { rawHtml: renderExtendedTable(markdown, options) };
    },
  });
}
