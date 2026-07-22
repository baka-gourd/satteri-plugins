# Satteri Plugins

Temporary workspace for Satteri plugin packages.

## Packages

- `satteri-extended-table`: extended table rowspan and colspan support for Satteri.
- `satteri-admonitions-to-directives`: converts GitHub alert blockquotes to
  directive nodes for Satteri.
- `satteri-katex`: package scaffold for KaTeX support in Satteri.
- `satteri-sectionize`: wraps heading sections in `<section>` elements.

> [!WARNING]
> Satteri is still in early development, and the plugin API is not stable.
>
> Urrently, sectionize will cause footnotes generation failed.
> katex not works fine in MDX, wait satteri update to fix it.

## Development

Install dependencies:

```sh
pnpm install
```

Run checks:

```sh
pnpm -r check
pnpm -r test
pnpm -r build
```

Build artifacts are generated under each package's `dist` directory. They are not
committed by default, but they must exist before publishing a package.
