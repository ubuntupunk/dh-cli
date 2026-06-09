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
- **SSH keys** set up with GitHub (recommended) — or **GitHub CLI** (`gh`) for HTTPS authentication

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

```bash
# SSH (recommended — requires SSH keys set up with GitHub)
export DOC_HUB_REPO="git@github.com:yourusername/my-stack-playbook.git"

# HTTPS alternative (requires gh auth login or a credential helper)
# export DOC_HUB_REPO="https://github.com/yourusername/my-stack-playbook.git"
```

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

### `dh sync` requests login

This happens when using an HTTPS remote without a credential helper configured. Options:

- **Switch to SSH** (recommended): Set `DOC_HUB_REPO` to an SSH URL (see above).
- **Use `gh`**: Run `gh auth login` to authenticate, then `gh auth setup-git` to configure git to use your token.
- **Use a PAT**: Create a [GitHub personal access token](https://github.com/settings/tokens) and use a credential helper like `git config --global credential.helper store`.

You'll see something like:

```bash
→ git push origin main
Username for 'https://github.com':
```

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
