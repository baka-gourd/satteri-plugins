import {
  defineMdastPlugin,
  type Custom,
  type MdastNode,
  type MdastPluginDefinition,
} from "satteri";

export interface SectionizeOptions {
  /** Deepest heading level that starts a section. @default 6 */
  maxDepth?: number;
}

type HeadingNode = Extract<MdastNode, { type: "heading" }>;
type SectionContent = MdastNode | Custom;

export interface SectionData {
  hName: "section";
  depth: number;
}

export type SectionNode = Custom & {
  type: "section";
  data: SectionData;
  children: SectionContent[];
};

interface OpenSection {
  depth: number;
  children: SectionContent[];
}

const defaultMaxDepth = 6;

function isSectionHeading(
  node: Readonly<MdastNode>,
  maxDepth: number,
): node is Readonly<HeadingNode> {
  return node.type === "heading" && node.depth <= maxDepth;
}

function createSection(depth: number, children: SectionContent[]): SectionNode {
  return {
    type: "section",
    data: { hName: "section", depth },
    children,
  };
}

export function isSectionNode(
  node: Readonly<MdastNode | Custom>,
): node is Readonly<SectionNode> {
  const data = node.data as Record<string, unknown> | undefined;

  return (
    node.type === "section" &&
    data?.hName === "section" &&
    typeof data.depth === "number"
  );
}

function sectionizeChildren(
  children: readonly MdastNode[],
  maxDepth: number,
): SectionContent[] {
  const result: SectionContent[] = [];
  const sections: OpenSection[] = [];

  for (const child of children) {
    if (child.type === "mdxjsEsm") {
      sections.length = 0;
      result.push(child);
      continue;
    }

    if (!isSectionHeading(child, maxDepth)) {
      (sections.at(-1)?.children ?? result).push(child);
      continue;
    }

    while (sections.length > 0 && sections.at(-1)!.depth >= child.depth) {
      sections.pop();
    }

    const sectionChildren: SectionContent[] = [child];
    (sections.at(-1)?.children ?? result).push(createSection(child.depth, sectionChildren));
    sections.push({ depth: child.depth, children: sectionChildren });
  }

  return result;
}

function firstSectionHeadingIndex(children: readonly MdastNode[], maxDepth: number) {
  return children.findIndex((child) => isSectionHeading(child, maxDepth));
}

/**
 * Wraps each heading and its following sibling content in a `<section>`.
 *
 * Sections end at the next heading of the same or a higher level. MDX ESM
 * nodes remain outside sections, matching `remark-sectionize`.
 */
export function sectionize(options: SectionizeOptions = {}): MdastPluginDefinition {
  const maxDepth = options.maxDepth ?? defaultMaxDepth;
  const processedParents = new WeakSet<object>();

  return defineMdastPlugin({
    name: "sectionize",
    heading(node, ctx) {
      if (!isSectionHeading(node, maxDepth)) {
        return;
      }

      const parent = ctx.parent(node);
      const index = ctx.indexOf(node);

      if (
        index === undefined ||
        processedParents.has(parent) ||
        index !== firstSectionHeadingIndex(parent.children, maxDepth)
      ) {
        return;
      }

      processedParents.add(parent);
      ctx.setProperty(parent, "children", sectionizeChildren(parent.children, maxDepth));
    },
  });
}
