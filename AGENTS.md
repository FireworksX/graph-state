# Repository Guidelines

## Project Structure & Module Organization
- `packages/core` holds the TypeScript engine and ships compiled artifacts in `dist/` via `tsup`.
- `packages/react` wraps the core for React apps; hooks live under `src/hooks`.
- `packages/checkers` defines constraint helpers referenced across workspaces.
- `plugins/` contains optional extensions; keep plugin-specific assets beside their source.
- `examples/` demonstrates integration patterns but is excluded from workspaces. Shared scripts and lint presets sit in `scripts/`.

## Build, Test, and Development Commands
- `yarn dev` runs `turbo run dev`, starting all workspace-level watch tasks.
- `yarn build` compiles every package; use `yarn workspace @graph-state/core build` for targeted builds.
- `yarn test` executes Vitest suites across workspaces; append `--watch` locally when iterating.
- `yarn lint` enforces ESLint + Prettier, while `yarn typecheck` surfaces TypeScript issues.
- `yarn changeset` creates release notes; `yarn release` chains build, quality gates, and publish steps.

## Coding Style & Naming Conventions
Write TypeScript first, using ES modules. Prefer named exports for utilities and PascalCase for React components. Keep files and directories kebab-case (`graph-store.ts`). The ESLint preset forbids `console.log`, enforces single-variable declarations, and requires explicit `import type` statements. Prettier formats with two-space indentation, single quotes, and trailing commas; run `yarn lint --fix` before submitting.

## Testing Guidelines
Vitest is configured per package (`vitest.config.ts`). Place specs beside code as `*.test.ts(x)` or `*.spec.ts(x)` to inherit relaxed lint rules. Use `vi.mock` sparingly—prefer the real graph state where feasible—and ensure new behaviors include regression tests. For type-level assertions, run `yarn workspace @graph-state/core test:types`. Aim to keep coverage steady; call out gaps in your pull request if coverage drops.

## Commit & Pull Request Guidelines
Follow the existing subject prefixes (`feat/#123`, `master: …`, `chore:`) and keep subjects under 72 characters. Reference issue numbers inline when applicable. Each PR should include: a concise summary, validation notes (tests or screenshots), and any required `changeset` entry. Rebase before requesting review to keep the history linear and avoid merge commits from master.
