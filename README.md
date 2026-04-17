# dh

![Made in South Africa](https://shields.io)

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

## Installation

```bash
# Install globally from npm
npm install -g @ubuntupunk/dh
```

# In your working repo

dh init → sets up submodule + adds note to AGENTS.md
dh add-pattern foo → creates markdown with .md suffix, no need to add it.
dh sync
dh contribute "new setup"
dh search foo

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

## Why this exists

I got tired of technical docs scattered across repos. Now everything lives in one place and is instantly available (and updatable) in every project.
