import katexLib, { type KatexOptions as BaseKatexOptions } from "katex";
import {
  defineMdastPlugin,
  htmlToHast,
  type Custom,
  type MdastNode,
  type MdastPluginDefinition,
} from "satteri";

export type KatexOptions = Omit<BaseKatexOptions, "displayMode" | "throwOnError">;

type MathLikeNode = Extract<MdastNode, { type: "math" | "inlineMath"; value: string }>;

interface DiagnosticContext {
  report(input: {
    message: string;
    node?: Readonly<MdastNode>;
    severity?: "error" | "warning" | "info";
  }): void;
}

const emptyOptions: Readonly<KatexOptions> = {};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderKatexError(value: string, error: unknown, options: Readonly<KatexOptions>) {
  const title = escapeHtml(String(error));
  const color = escapeHtml(options.errorColor ?? "#cc0000");
  const content = escapeHtml(value);

  return `<span class="katex-error" style="color:${color}" title="${title}">${content}</span>`;
}

function renderMath(
  node: Readonly<MathLikeNode>,
  displayMode: boolean,
  options: Readonly<KatexOptions>,
  ctx: DiagnosticContext,
) {
  const value = node.value;

  try {
    return katexLib.renderToString(value, {
      ...options,
      displayMode,
      throwOnError: true,
    });
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));

    ctx.report({
      message: `Could not render math with KaTeX: ${cause.message}`,
      node,
      severity: "error",
    });

    try {
      return katexLib.renderToString(value, {
        ...options,
        displayMode,
        strict: "ignore",
        throwOnError: false,
      });
    } catch {
      return renderKatexError(value, error, options);
    }
  }
}

function mathNode(html: string): Custom {
  // Parse HTML directly so Markdown syntax in formulas remains literal text.
  const root = htmlToHast(html, { fragment: true });
  const element = root.type === "root" ? root.children[0] : undefined;
  if (element?.type !== "element") {
    throw new Error("Expected KaTeX to render an HTML element");
  }

  // Pass HAST through the custom node without adding a paragraph or wrapper.
  return {
    type: "katex",
    data: {
      hName: element.tagName,
      hProperties: element.properties,
      hChildren: element.children,
    },
    children: [],
  };
}

export function katex(options?: Readonly<KatexOptions>): MdastPluginDefinition {
  const settings = options ?? emptyOptions;

  return defineMdastPlugin({
    name: "katex",
    math(node, ctx) {
      ctx.replaceNode(node, mathNode(renderMath(node, true, settings, ctx)));
    },
    inlineMath(node, ctx) {
      ctx.replaceNode(node, mathNode(renderMath(node, false, settings, ctx)));
    },
  });
}
