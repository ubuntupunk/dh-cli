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

program
  .name("dh")
  .description("Sparse Document Hub CLI — .documents playbook manager")
  .version("0.2.1");

program
  .command("init")
// ... (omitting init for brevity, but I will include it in the actual replace call if needed, 
// though the instruction says "Add a helper function..." so I should be careful to only replace what's necessary)
  .description("Initialize .documents submodule")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .option("-r, --repo <url>", "Hub repo URL", DOC_HUB_REPO)
  .action((options) => {
    const dir = options.dir;
    const repo = options.repo;

    if (fs.existsSync(dir)) {
      console.error(`❌ ${dir} already exists`);
      process.exit(1);
    }

    console.log(`🔧 Adding document hub → ${dir}`);
    run(`git submodule add --name documents ${repo} ${dir}`);

    // Add instructions to AGENTS.md
    const agentsPath = "AGENTS.md";
    let content = fs.existsSync(agentsPath)
      ? fs.readFileSync(agentsPath, "utf8")
      : "# AI Agents & Context\n\n";

    const section = `\n## Document Hub\nUse \`dh update\` or \`dh sync "message"\`.\nAll shared knowledge & playbook lives in \`./${dir}/\`.`;

    if (!content.includes("Document Hub")) {
      fs.writeFileSync(agentsPath, content.trim() + section);
      console.log("✅ Added Document Hub section to AGENTS.md");
    }

    console.log("✅ .documents initialized");
    console.log('   git commit -m "chore: add .documents hub"');
  });

program
  .command("update")
  .description("Pull latest from .documents hub")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((options) => {
    run(`git submodule update --remote --merge ${options.dir}`);
    console.log(`✅ Updated ${options.dir}`);
  });

program
  .command("sync")
  .description("Update from hub + contribute changes back")
  .argument("[message]", "Commit message", "sync: update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((message, options) => {
    const dir = options.dir;
    let cwd = process.cwd(); // ← Important: declare here

    // === Smart location detection ===
    if (fs.existsSync(path.join(cwd, dir, ".git"))) {
      // Correct: We are in project root
      console.log(`📍 Running from project root`);
    } else if (fs.existsSync(path.join(cwd, ".git"))) {
      // We are inside .documents → go up
      console.log(`→ Detected inside submodule, moving to parent`);
      process.chdir("..");
      cwd = process.cwd();
    } else {
      console.error(`❌ Not in a valid git project (no .git found)`);
      process.exit(1);
    }

    // Final safety check
    if (!fs.existsSync(".git")) {
      console.error(`❌ Not in git repository root`);
      process.exit(1);
    }
    if (!fs.existsSync(path.join(dir, ".git"))) {
      console.error(`❌ ${dir} is not a valid submodule`);
      process.exit(1);
    }

    console.log("--- Updating from remote ---");
    run(`git submodule update --remote --merge ${dir}`);

    console.log("--- Committing changes in .documents ---");
    process.chdir(dir); // go into submodule
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("→ No changes in submodule");
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
      console.log("→ No changes to parent commit");
    }

    // Smart push handling for parent repo
    if (hasRemote()) {
      try {
        run("git push");
        console.log("✅ Parent repo pointer pushed");
      } catch (e) {
        console.warn("\n⚠️  Failed to push parent repo pointer. Submodule is synced, but parent history is local.");
      }
    } else {
      console.log("\nℹ️  Skipping parent push: No remote configured.");
      console.log("   (Submodule was successfully updated and pushed)");
    }

    console.log("\n✨ Sync complete");
  });

program
  .command("contribute")
  .description("Push changes back to hub")
  .argument("[message]", "Commit message", "update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((message, options) => {
    const dir = options.dir;
    let cwd = process.cwd();

    // === Smart location detection ===
    if (fs.existsSync(path.join(cwd, dir, ".git"))) {
      // We are in project root → perfect
      console.log(`📍 Running from project root`);
    } else if (fs.existsSync(path.join(cwd, ".git"))) {
      // We are inside .documents → go up one level
      console.log(`→ Detected inside submodule, moving to parent`);
      process.chdir("..");
      cwd = process.cwd();
    } else {
      console.error(`❌ Not in a valid project (no .git found)`);
      process.exit(1);
    }

    if (!fs.existsSync(".git")) {
      console.error(`❌ Not in git repository root`);
      process.exit(1);
    }

    console.log(`📤 Contributing changes from .documents`);

    // 1. Work inside the submodule
    process.chdir(dir);
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("→ No changes to commit in .documents");
    }
    run("git push origin main");

    // 2. Update parent repo
    process.chdir(cwd); // go back to root
    run(`git add ${dir}`);
    try {
      run(`git commit -m "chore(docs): update .documents (${message})"`);
    } catch (e) {
      console.log("→ No changes to parent commit");
    }

    // Smart push handling for parent repo
    if (hasRemote()) {
      try {
        run("git push");
        console.log("✅ Parent repo pointer updated");
      } catch (e) {
        console.warn("\n⚠️  Failed to push parent repo pointer. Hub was updated, but parent history is local.");
      }
    } else {
      console.log("\nℹ️  Skipping parent push: No remote configured.");
      console.log("   (Document Hub was successfully updated and pushed)");
    }

    console.log("\n✨ Successfully contributed to document hub");
  });

program
  .command("new-pattern")
  .description("Create new pattern in .documents/patterns/")
  .argument("<name>", "Pattern name (kebab-case)")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((name, options) => {
    const patternsDir = path.join(options.dir, "patterns");
    if (!fs.existsSync(patternsDir))
      fs.mkdirSync(patternsDir, { recursive: true });

    const filePath = path.join(patternsDir, `${name}.md`);
    const template = `# ${name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n\n## Context\n\n## Solution\n\n## Example\n\n`;

    fs.writeFileSync(filePath, template);
    console.log(`✅ Created ${filePath}`);
  });

program
  .command("search")
  .description("Search inside .documents")
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
