---
paths:
  - ".claude/**"
  - ".mcp.json"
---

# Claude Code tooling (`.claude/`, `.mcp.json`)

## Agents pin `model: sonnet`

All agents under `.claude/agents/` pin `model: sonnet` in their frontmatter. That
is load-bearing, not a restated preference. `CLAUDE_CODE_SUBAGENT_MODEL` does not
reach the subagent in the desktop app: the sibling keys in the same
`settings.json` `env` block do arrive (`echo $ANTHROPIC_BASE_URL` proves it),
that one does not. An agent with no `model:` therefore inherits the main thread's
Opus. Removing the line silently triples the cost of a fan-out. Override at the
call site when a job needs more. A new agent gets the same line.

## Hooks

PreToolUse guards block Edit/Write with exit 2 — by design:

- `guard-publish.sh` — setting `status` to `published` by hand, for a question or
  a lesson (F2-12). The only path is `yarn publish:questions|publish:lessons
--reviewer "<name>"`, the one place the reviewer gets recorded.
- `guard-generated.sh` — `questions/index.json`, `lessons/index.json`,
  `data/manifest.json`, `docs/coverage.md`, `public/data/*`, `yarn.lock`.

PostToolUse, each scoped to the paths it cares about:

- `validate-data.sh` — `data/*.json`: `build:index`, `validate:data`,
  `sync:data`, `stats`. Only errors come back; `sync:data` and `stats` stay quiet.
- `typecheck.sh` — `src/**/*.ts(x)`: `yarn typecheck`, reported on failure.
- `lint.sh` — `src/**/*.ts(x)`: `yarn lint`, for the rules the compiler cannot
  see, `react-hooks/exhaustive-deps` above all.
- `i18n-parity.sh` — `src/lib/i18n/locales/*.json`: `yarn validate:i18n`.
  i18next falls back to English for a missing Turkish key and the E2E specs read
  English labels, so nothing else turns red.
- `format.sh` — Prettier on the written file, always silent.

A hook file on disk that `.claude/settings.json` does not register is not active.

## MCP

`.mcp.json` is checked in: Playwright (pinned `@playwright/mcp@0.0.82`) and
context7. context7 reads `CONTEXT7_API_KEY` from the environment and works
unauthenticated without it.
