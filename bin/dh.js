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

program
  .name("dh")
  .description("Sparse Document Hub CLI — .documents playbook manager")
  .version("0.2.0");

program
  .command("init")
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

    if (!fs.existsSync(path.join(dir, ".git"))) {
      console.error(`❌ ${dir} is not a valid submodule`);
      process.exit(1);
    }

    console.log("--- Updating from remote ---");
    run(`git submodule update --remote --merge ${dir}`);

    console.log("--- Committing changes in .documents ---");
    process.chdir(dir);
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("→ No changes in submodule");
    }
    run("git push origin main");

    process.chdir("..");

    console.log("--- Updating parent repo pointer ---");
    run(`git add ${dir}`);

    try {
      run(
        `git commit -m "chore(docs): update .documents pointer (${message})"`,
      );
    } catch (e) {
      console.log("→ No changes to parent commit");
    }

    // NEW: Smart push handling
    try {
      run("git push");
    } catch (e) {
      console.error("\n❌ Parent repo has no remote configured.");
      console.log("   Fix with:");
      console.log("   git remote add origin <your-repo-url>");
      console.log("   git push -u origin main\n");
      process.exit(1);
    }

    console.log("✅ Sync complete");
  });

program
  .command("contribute")
  .description("Push changes back to hub (without pulling)")
  .argument("[message]", "Commit message", "update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((message, options) => {
    const dir = options.dir;
    // ... same as before until the parent push ...

    process.chdir("..");
    run(`git add ${dir}`);
    try {
      run(`git commit -m "chore(docs): update .documents (${message})"`);
    } catch (e) {
      console.log("→ No changes to parent");
    }

    try {
      run("git push");
    } catch (e) {
      console.error("\n❌ Parent repo has no remote configured.");
      console.log("   Run: git remote add origin <your-repo-url>");
      console.log("   Then: git push -u origin main");
      process.exit(1);
    }

    console.log("✅ Contributed");
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
