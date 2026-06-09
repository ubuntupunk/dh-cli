# dh

[![GitHub](https://img.shields.io/badge/GitHub-ubuntupunk/dh--cli-blue)](https://github.com/ubuntupunk/dh-cli)
[![License](https://img.shields.io/badge/License-GPL-green.svg)](LICENSE)

<a href="https://github.com/pedromxavier/flag-badges">
    <img src="https://raw.githubusercontent.com/pedromxavier/flag-badges/main/badges/ZA.svg" alt="made in za">
</a>

**Sparse Document Hub CLI** — repo level management for docs & personal playbook across projects.

Create a central `my-stack-playbook` or `my-docuhub` repo. Linked into every project via git submodule. Zero duplication.

Allow your agents to edit documents in .documents/ and use `dh sync` to keep the central hub updated.

Parent repository pointer updates are handled gracefully and do not require a remote.

## Features

- `dh init` — add the dochub submodule + AGENTS.md instructions
- `dh sync` — update & pull latest playbook
- `dh update` — non-destructive pull
- `dh contribute` — push new patterns back to the hub
- `dh search` - search your .documents using grep
- `dh add-pattern <name>` — create a new pattern template

## Prerequisites

- **Node.js** (for the CLI itself)
- **Git** (for submodule operations)
- **GitHub CLI** (`gh`) — required for authentication with HTTPS remotes. Install via `brew install gh`, `sudo apt install gh`, or [gh cli install docs](https://github.com/cli/cli#installation). Then authenticate: `gh auth login`

## Installation

```bash
# Install globally from npm
npm install -g @ubuntupunk/dh
```

# In your working repo

```bash
dh init → sets up submodule + adds note to AGENTS.md
dh add-pattern foo → creates markdown with .md suffix, no need to add it.
dh sync
dh contribute "new setup"
dh search foo
```

# Set once in ~/.zshrc / ~/.bashrc

export DOC_HUB_REPO="https://github.com/yourusername/my-stack-playbook.git"

```bash
# Recommended Hub Structure (my-stack-playbook)

.documents/
├── README.md
├── core/
├── patterns/          ← your top skills & solutions
├── templates/
├── divergences/
└── decisions/
```

## Troubleshooting

## `dh sync` requests login

dh sync calls the official gh tool, if you are not logged into github, you may run into this:

```bash

Running from project root
--- Updating from remote ---
→ git submodule update --remote --merge .documents
--- Committing changes in .documents ---
→ git add -A
→ git commit -m "added README"
[main 3fd2ddd] added README
 1 file changed, 27 insertions(+)
 create mode 100644 README.md
→ git push origin main
Username for 'https://github.com':
```

Remedy: make sure you are authorised via `gh auth login`

### `dh sync` interrupted mid-push

If `dh sync` is interrupted after committing local changes but before pushing, running it again is safe and idempotent. It will:

1. Pull from remote (no-op if already up to date)
2. Attempt to commit again — skips with "No changes in submodule" if nothing new
3. Push any pending local commits in `.documents`
4. Update and push the parent repo's submodule pointer

Alternatively, manually complete the interrupted push:

```bash
cd .documents && git push origin main
cd .. && git add .documents && git commit -m "chore: update pointer" && git push
```

## Why this exists

I got tired of technical docs scattered across repos. Now everything lives in one place and is instantly available (and updatable) in every project.
