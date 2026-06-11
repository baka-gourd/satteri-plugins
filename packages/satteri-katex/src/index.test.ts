import katexLib from "katex";
import { expect, test, vi } from "vitest";
import { markdownToHtml } from "satteri";
import { katex, type KatexOptions } from "./index.js";

const process = async (markdown: string, options?: KatexOptions) => {
  const result = await markdownToHtml(markdown, {
    features: { math: true },
    mdastPlugins: [katex(options)],
  });

  return result.html.trim();
};

test("renders block math in display mode", async () => {
  const result = await process("$$\nx^2\n$$");

  expect(result).toContain("katex-display");
  expect(result).toContain(katexLib.renderToString("x^2", { displayMode: true }));
});

test("renders inline math without display mode", async () => {
  const result = await process("Before $x^2$ after.");

  expect(result).toContain('class="katex"');
  expect(result).not.toContain("katex-display");
  expect(result).toContain(katexLib.renderToString("x^2"));
});

test("supports KaTeX macros", async () => {
  const macros = { "\\RR": "\\mathbb{R}" };
  const result = await process("$\\RR$", { macros });

  expect(result).toContain(katexLib.renderToString("\\RR", { macros }));
});

test("falls back to KaTeX non-throwing render for parse errors", async () => {
  const result = await process("$\\notacommand$", { errorColor: "orange" });

  expect(result).toContain('class="katex"');
  expect(result).toContain('style="color:orange;"');
  expect(result).toContain("\\notacommand");
  expect(result).toContain(
    katexLib.renderToString("\\notacommand", {
      errorColor: "orange",
      throwOnError: false,
    }),
  );
});

test("supports strict ignore fallback behavior", async () => {
  const result = await process("$锚&$", { errorColor: "orange", strict: "ignore" });

  expect(result).toContain('class="katex-error"');
  expect(result).toContain('style="color:orange"');
  expect(result).toContain("锚&amp;");
});

test("supports TeX comments", async () => {
  const value = "\\begin{split}\n  f(-2) &= \\sqrt{-2+4} \\\\\n  &= x % Test Comment\n\\end{split}";
  const result = await process(`$$\n${value}\n$$`, { strict: "ignore" });

  expect(result).toContain("katex-display");
  expect(result).toContain("<mtable");
  expect(result).toContain("% Test Comment");
  expect(result).not.toContain("katex-error");
});

test("does not crash on non-parse errors", async () => {
  const value = "\\begin{split}\n\\end{{split}}\n";
  const result = await process(`$$\n${value}$$`);

  expect(result).toContain('class="katex-error"');
  expect(result).toContain("Expected node of type textord");
  expect(result).toContain("\\begin");
});

test("uses manual error markup when fallback rendering also fails", async () => {
  const renderSpy = vi
    .spyOn(katexLib, "renderToString")
    .mockImplementationOnce(() => {
      throw new Error("primary failure");
    })
    .mockImplementationOnce(() => {
      throw new Error("secondary failure");
    });

  try {
    const result = await process("$x$", { errorColor: "#123456" });

    expect(result).toContain('class="katex-error"');
    expect(result).toContain('style="color:#123456"');
    expect(result).toContain('title="Error: primary failure"');
    expect(result).toContain(">x<");
  } finally {
    renderSpy.mockRestore();
  }
});

test("escapes manual error markup", async () => {
  const renderSpy = vi.spyOn(katexLib, "renderToString").mockImplementation(() => {
    throw new Error('"broken" <math>');
  });

  try {
    const result = await process("$<script>&\"$", { errorColor: '"red"&' });

    expect(result).toContain('class="katex-error"');
    expect(result).toContain('style="color:&quot;red&quot;&amp;"');
    expect(result).toContain('title="Error: &quot;broken&quot; &lt;math&gt;"');
    expect(result).toContain("&lt;script&gt;&amp;\"");
    expect(result).not.toContain("<script>");
  } finally {
    renderSpy.mockRestore();
  }
});
