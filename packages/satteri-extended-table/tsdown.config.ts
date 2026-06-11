import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	deps: {
		neverBundle: [
			"hast-util-to-html",
			"mdast-util-extended-table",
			"mdast-util-from-markdown",
			"mdast-util-gfm-table",
			"mdast-util-to-hast",
			"micromark-extension-extended-table",
			"micromark-extension-gfm-table",
			"satteri",
		],
	},
});
