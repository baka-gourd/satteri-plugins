import {
	defineMdastPlugin,
	type MdastNode,
	type MdastPluginDefinition,
} from "satteri";

export const githubAlertTypes = [
	"NOTE",
	"TIP",
	"IMPORTANT",
	"WARNING",
	"CAUTION",
] as const;

export type GithubAlertType = (typeof githubAlertTypes)[number];

export type AlertTypeMapping = Record<GithubAlertType, string>;

export interface AdmonitionsToDirectivesOptions {
	mapping?: AlertTypeMapping;
}

export const defaultMapping: AlertTypeMapping = {
	NOTE: "note",
	TIP: "tip",
	IMPORTANT: "info",
	WARNING: "warning",
	CAUTION: "danger",
};

type BlockquoteNode = Extract<MdastNode, { type: "blockquote" }>;
type ParagraphNode = Extract<MdastNode, { type: "paragraph" }>;
type TextNode = Extract<MdastNode, { type: "text" }>;
type ContainerDirectiveNode = Extract<
	MdastNode,
	{ type: "containerDirective" }
>;

interface GithubAlert {
	type: GithubAlertType;
	children: ContainerDirectiveNode["children"];
}

const githubAlertDeclarationRegex = /^\s*\[!(?<type>\w+)\]\s*$/;

function isGithubAlertType(value: unknown): value is GithubAlertType {
	return (
		typeof value === "string" &&
		(githubAlertTypes as readonly string[]).includes(value)
	);
}

function parseGithubAlertDeclaration(text: string): GithubAlertType | null {
	const type = text.match(githubAlertDeclarationRegex)?.groups?.type;
	return isGithubAlertType(type) ? type : null;
}

function parseGithubAlertBlockquote(
	node: Readonly<BlockquoteNode>,
): GithubAlert | null {
	const [firstChild, ...blockquoteChildren] = node.children;

	if (firstChild?.type !== "paragraph") {
		return null;
	}

	const [firstParagraphChild, ...paragraphChildren] = firstChild.children;

	if (firstParagraphChild?.type !== "text") {
		return null;
	}

	const [possibleTypeDeclaration, ...textNodes] =
		firstParagraphChild.value.split("\n");

	if (possibleTypeDeclaration === undefined) {
		return null;
	}

	const type = parseGithubAlertDeclaration(possibleTypeDeclaration);

	if (type === null) {
		return null;
	}

	const textNodeChildren: TextNode[] =
		textNodes.length > 0 ? [{ type: "text", value: textNodes.join("\n") }] : [];

	const hasParagraphChildren =
		textNodeChildren.length > 0 || paragraphChildren.length > 0;

	const alertParagraphChildren: ParagraphNode[] = hasParagraphChildren
		? [
				{
					type: "paragraph",
					children: [...textNodeChildren, ...paragraphChildren],
				},
			]
		: [];

	return {
		type,
		children: [...alertParagraphChildren, ...blockquoteChildren],
	};
}

/**
 * Converts GitHub alert blockquotes to Satteri container directive nodes.
 *
 * Default mapping follows `remark-github-admonitions-to-directives`:
 *
 * - `NOTE` -> `note`
 * - `TIP` -> `tip`
 * - `IMPORTANT` -> `info`
 * - `WARNING` -> `warning`
 * - `CAUTION` -> `danger`
 */
export function admonitionsToDirectives(
	options?: AdmonitionsToDirectivesOptions,
): MdastPluginDefinition {
	const mapping = options?.mapping ?? defaultMapping;

	return defineMdastPlugin({
		name: "admonitions-to-directives",
		blockquote(node) {
			const githubAlert = parseGithubAlertBlockquote(node);

			if (githubAlert === null) {
				return;
			}

			return {
				type: "containerDirective",
				name: mapping[githubAlert.type],
				children: githubAlert.children,
			};
		},
	});
}
