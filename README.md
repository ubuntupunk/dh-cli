# dh

**Sparse Document Hub CLI** — repo level management for docs & personal playbook across projects.

Allows you to create a central `my-stack-playbook` repo. Linked into every project via git submodule. Zero duplication.

## Features

- `dh init` — add the dochub submodule + AGENTS.md instructions
- `dh update` — pull latest playbook
- `dh contribute` — push new patterns back to the hub
- `dh new-pattern <name>` — create a new pattern template
- `dh search <term>` — quick search across all docs

## Installation

```bash
# Clone and install globally
git clone https://github.com/yourusername/dh-cli.git
cd dh-cli
npm install
npm link # makes `dh` command available globally

# In your working repo``
dh init → sets up submodule + adds note to AGENTS.md
dh new-pattern drizzle-transaction → creates ready markdown
dh update
dh contribute "new pino setup"
dh search drizzle

# Set once in ~/.zshrc / ~/.bashrc

export DOC_HUB_REPO="https://github.com/yourusername/my-stack-playbook.git"

```

Recommended Hub Structure (my-stack-playbook)

```text
doch/
├── README.md
├── core/
├── patterns/          ← your top skills & solutions
├── templates/
├── divergences/
└── decisions/
```

## Why this exists

I got tired of technical docs scattered across repos. Now everything lives in one place and is instantly available (and updatable) in every project.
