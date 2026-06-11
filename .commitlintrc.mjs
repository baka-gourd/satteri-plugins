import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const packages = readdirSync(resolve(rootDir, "packages"));

export default {
	prompt: {
		scopes: [...packages],
		enableMultipleScopes: true,
		scopeEnumSeparator: ","
	},
};
