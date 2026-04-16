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
  .description(
    "Update from hub + contribute changes back (like your git alias)",
  )
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

    console.log("--- Committing changes in hub ---");
    process.chdir(dir);
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("→ No changes to commit");
    }
    run("git push origin main"); // Change branch if needed

    console.log("--- Updating parent repo pointer ---");
    process.chdir("..");
    run(`git add ${dir}`);
    run(`git commit -m "chore(docs): update .documents pointer (${message})"`);
    run("git push");

    console.log("✅ Sync complete");
  });

program
  .command("contribute")
  .description("Only push changes back (without pulling first)")
  .argument("[message]", "Commit message", "update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DIR)
  .action((message, options) => {
    // Same logic as sync but without update step
    const dir = options.dir;
    process.chdir(dir);
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("→ No changes");
    }
    run("git push origin main");

    process.chdir("..");
    run(`git add ${dir}`);
    run(`git commit -m "chore(docs): update .documents (${message})"`);
    run("git push");

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
