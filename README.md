# DEFA

External curation layer for Claude Code global config. DEFA keeps the curated
master (the *payload*) of Claude Code artifacts — `CLAUDE.md`, `skills/`,
`commands/`, `agents/` — under version control, and deploys them by symlinking
each payload file into the target root, strictly additively, behind a
secret-scan and diff-review gate. Once linked, edits are made in this repo only
and take effect immediately.

## Commands

| Command | Description |
|---|---|
| `defa import` | Bootstrap the payload from existing target root artifacts. Prompts before overwriting curated entries; `--force` skips the prompt. Entries already linked to the payload are skipped. |
| `defa status` | Summarize payload vs the target root (`new` / `changed` / `unlinked` / `linked`). |
| `defa diff` | Dry-run: secret scan + unified diff, no writes. |
| `defa deploy` | Scan → diff → confirm → symlink. An existing target file is first renamed to `<name>.defa-backup-<timestamp>`. Blocks on secret findings unless `--force`. |
| `defa rollback` | Restore the payload from the previous commit; linked targets reflect it immediately. |

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

- **Strictly additive**: only DEFA-owned payload paths are linked in the
  target; nothing else in the target root is touched or deleted. A file being
  replaced by a link is backed up, never deleted.
- **Secret gate at deploy only**: once linked, payload edits go live without
  passing through `defa deploy`, so the scan does not cover later edits.
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