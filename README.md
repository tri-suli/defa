# DEFA

External curation layer for `~/.claude/` global config. DEFA keeps a curated
master copy (the *payload*) of Claude Code artifacts — `CLAUDE.md`, `skills/`,
`commands/`, `agents/` — under version control, and deploys them one-way,
strictly additively, behind a secret-scan and diff-review gate.

## Commands

| Command | Description |
|---|---|
| `defa import` | Bootstrap the payload from existing `~/.claude/` artifacts. Prompts before overwriting curated entries; `--force` skips the prompt. |
| `defa status` | Summarize payload vs `~/.claude/` (`new` / `changed` / `same`). |
| `defa diff` | Dry-run: secret scan + unified diff, no writes. |
| `defa deploy` | Scan → diff → confirm → additive copy. Blocks on secret findings unless `--force`. |
| `defa rollback` | Restore the payload from the previous commit, then re-run `defa deploy` to apply. |

## Configuration

Optional `defa.config.json` in the project root:

```json
{
  "targetRoot": "~/.claude",
  "managed": ["CLAUDE.md", "skills", "commands", "agents"],
  "secretPatterns": ["sk-[A-Za-z0-9]{16,}"]
}
```

All fields are optional; invalid JSON or wrong field types fail fast with a
descriptive error.

## Guarantees

- **Strictly additive**: only DEFA-owned payload files are written to the
  target; nothing else in `~/.claude/` is touched or deleted.
- **Path-safe**: payload entries that would resolve outside the target root
  are rejected before any write.
- **Secret gate**: deploy is blocked when secret patterns match, unless
  explicitly overridden with `--force`.

## Known limitations

- **Binary files**: payload files are read as UTF-8 text for diffing and
  secret scanning. Binary files (images, archives, etc.) may be reported as
  `changed` unreliably and their diffs are not meaningful. Keep the payload
  text-only; binary assets are outside DEFA's scope.

## Development

```bash
npm install
npm test          # vitest suite (unit + temp-dir integration)
npm run typecheck # tsc --noEmit
npm run build     # bundle to dist/cli.js
npm run dev       # run the CLI via tsx
```