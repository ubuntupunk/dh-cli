#!/usr/bin/env node

const { program } = require("commander");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DOC_HUB_REPO =
  process.env.DOC_HUB_REPO ||
  "https://github.com/yourusername/my-stack-playbook.git";
const DEFAULT_DIR = ".documents";

function run(cmd) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function hasRemote() {
  try {
    const remotes = execSync("git remote", { encoding: "utf8" }).trim();
    return remotes.length > 0;
  } catch (e) {
    return false;
  }
}

function ensureProjectRoot(dir) {
  let cwd = process.cwd();

  // === Smart location detection ===
  if (fs.existsSync(path.join(cwd, dir, ".git"))) {
    // Correct: We are in project root
    console.log(`Running from project root`);
  } else if (fs.existsSync(path.join(cwd, ".git"))) {
    // We are inside .documents → go up
    console.log(`Detected inside submodule, moving to parent`);
    process.chdir("..");
    cwd = process.cwd();
  } else {
    console.error(`Not in a valid git project (no .git found)`);
    process.exit(1);
  }

  // Final safety checks
  if (!fs.existsSync(".git")) {
    console.error(`Not in git repository root`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(dir, ".git"))) {
    console.error(`${dir} is not a valid submodule`);
    process.exit(1);
  }

  return cwd;
}

program
  .name("dh")
  .description("Sparse Document Hub CLI — .documents playbook manager")
  .version("0.2.7");

program
  .command("init")
  .description("Initialize document hub submodule and AGENTS.md instructions")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .option("-r, --repo <url>", "Hub repository URL", DOC_HUB_REPO)
  .action((options) => {
    const dir = options.dir;
    const repo = options.repo;

    if (!fs.existsSync(".git")) {
      console.error("Not a git repository. Please run `git init` first.");
      process.exit(1);
    }

    if (fs.existsSync(dir)) {
      console.error(`${dir} already exists`);
      process.exit(1);
    }

    console.log(`Adding document hub -> ${dir}`);
    run(`git submodule add --name documents ${repo} ${dir}`);

    // Add instructions to AGENTS.md
    const agentsPath = "AGENTS.md";
    let content = fs.existsSync(agentsPath)
      ? fs.readFileSync(agentsPath, "utf8")
      : "";

    const section = `\n# DocHub\nUse \`dh update\` or \`dh sync "message"\`.\nAll shared knowledge & playbook lives in \`./${dir}/\`.`;

    if (!content.includes("DocHub")) {
      fs.writeFileSync(agentsPath, content.trim() + section);
      console.log("Added DocHub section to AGENTS.md");
    }

    console.log(".documents initialized");
    console.log('   git commit -m "chore: add .documents hub"');
  });

program
  .command("update")
  .description("Pull latest changes from remote hub (non-destructive)")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((options) => {
    const dir = options.dir;
    ensureProjectRoot(dir);

    console.log("--- Updating from remote ---");
    run(`git submodule update --remote --merge ${dir}`);
    console.log(`Updated ${dir}`);
  });

program
  .command("sync")
  .description("Pull updates, commit local changes, and push to hub")
  .argument("[message]", "Commit message", "sync: update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((message, options) => {
    const dir = options.dir;
    const cwd = ensureProjectRoot(dir);

    console.log("--- Updating from remote ---");
    run(`git submodule update --remote --merge ${dir}`);

    console.log("--- Committing changes in .documents ---");
    process.chdir(dir); // go into submodule
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("No changes in submodule");
    }
    run("git push origin main");

    // Go back to project root
    process.chdir(cwd);

    console.log("--- Updating parent repo pointer ---");
    run(`git add ${dir}`);
    try {
      run(
        `git commit -m "chore(docs): update .documents pointer (${message})"`,
      );
    } catch (e) {
      console.log("No changes to parent commit");
    }

    // Smart push handling for parent repo
    if (hasRemote()) {
      try {
        run("git push");
        console.log("Parent repo pointer pushed");
      } catch (e) {
        console.warn("\nFailed to push parent repo pointer. Submodule is synced, but parent history is local.");
      }
    } else {
      console.log("\nSkipping parent push: No remote configured.");
      console.log("   (Submodule was successfully updated and pushed)");
    }

    console.log("\nSync complete");
  });

program
  .command("contribute")
  .description("Commit local changes and push to hub without pulling first")
  .argument("[message]", "Commit message", "update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((message, options) => {
    const dir = options.dir;
    const cwd = ensureProjectRoot(dir);

    console.log(`Contributing changes from .documents`);

    // 1. Work inside the submodule
    process.chdir(dir);
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("No changes to commit in .documents");
    }
    run("git push origin main");

    // 2. Update parent repo
    process.chdir(cwd); // go back to root
    run(`git add ${dir}`);
    try {
      run(`git commit -m "chore(docs): update .documents (${message})"`);
    } catch (e) {
      console.log("No changes to parent commit");
    }

    // Smart push handling for parent repo
    if (hasRemote()) {
      try {
        run("git push");
        console.log("Parent repo pointer updated");
      } catch (e) {
        console.warn("\nFailed to push parent repo pointer. Hub was updated, but parent history is local.");
      }
    } else {
      console.log("\nSkipping parent push: No remote configured.");
      console.log("   (Document Hub was successfully updated and pushed)");
    }

    console.log("\nSuccessfully contributed to document hub");
  });

program
  .command("add-pattern")
  .description("Create a new markdown template in patterns/")
  .argument("<name>", "Pattern name (kebab-case)")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((name, options) => {
    const patternsDir = path.join(options.dir, "patterns");
    if (!fs.existsSync(patternsDir))
      fs.mkdirSync(patternsDir, { recursive: true });

    const filePath = path.join(patternsDir, `${name}.md`);
    const template = `# ${name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n\n## Context\n\n## Solution\n\n## Example\n\n`;

    fs.writeFileSync(filePath, template);
    console.log(`Created ${filePath}`);
  });

program
  .command("search")
  .description("Search all markdown files in the document hub")
  .argument("<query>", "Search term")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((query, options) => {
    try {
      const result = execSync(
        `grep -ri --include="*.md" "${query}" ${options.dir}`,
        { encoding: "utf8" },
      );
      console.log(result || "No matches");
    } catch (e) {
      console.log("No matches found");
    }
  });

program.parse();
