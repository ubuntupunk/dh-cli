Example Playbook repository.
├── README.md # Entry point: "My Stack Playbook – Drizzle + Pino + Next.js/Vercel"
├── playbook/
│ ├── core-stack/ # Your aligned stack (the 80%)
│ │ ├── nextjs-vercel.md
│ │ ├── drizzle-orm.md
│ │ ├── pino-logging.md
│ │ ├── auth.md
│ │ └── deployment.md
│ ├── skills/ # Your top skills as actionable playbooks
│ │ ├── my-drizzle-patterns.md
│ │ ├── pino-best-practices.md
│ │ ├── performance-tuning.md
│ │ └── decision-records/ # ADRs for divergences
│ ├── templates/ # Copy-paste starters
│ │ ├── docs-template.md
│ │ └── project-init.md
│ └── divergences/ # Project-specific notes (e.g. "Project X overrides")
├── assets/ # Diagrams, screenshots (keep light)
└── .github/ # Optional: workflows for linting docs, auto-build MkDocs if you want
