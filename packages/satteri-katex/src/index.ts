import katexLib, { type KatexOptions as BaseKatexOptions } from "katex";
import { defineMdastPlugin, type MdastNode, type MdastPluginDefinition } from "satteri";

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

export function katex(options?: Readonly<KatexOptions>): MdastPluginDefinition {
  const settings = options ?? emptyOptions;

  return defineMdastPlugin({
    name: "katex",
    math(node, ctx) {
      return { rawHtml: renderMath(node, true, settings, ctx) };
    },
    inlineMath(node, ctx) {
      return { type: "html", value: renderMath(node, false, settings, ctx) };
    },
  });
}
