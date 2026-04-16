#!/usr/bin/env node

const { program } = require("commander");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DOC_HUB_REPO =
  process.env.DOC_HUB_REPO ||
  "https://github.com/yourusername/my-stack-playbook.git";
const DEFAULT_DOCH_DIR = "doch";

function run(cmd) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

program
  .name("dh")
  .description("Sparse Document Hub CLI for your stack playbook")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize dochub submodule")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DOCH_DIR)
  .option("-r, --repo <url>", "Hub repo URL", DOC_HUB_REPO)
  .action((options) => {
    const dir = options.dir;
    const repo = options.repo;

    if (fs.existsSync(dir)) {
      console.error(`❌ ${dir}/ already exists`);
      process.exit(1);
    }

    console.log(`🔧 Adding dochub → ${dir}`);
    run(`git submodule add --name dochub ${repo} ${dir}`);

    // Add simple instructions to AGENTS.md (create if missing)
    const agentsPath = "AGENTS.md";
    let agentsContent = fs.existsSync(agentsPath)
      ? fs.readFileSync(agentsPath, "utf8")
      : "# AI Agents & Context\n\n";

    const instructions = `\n## Document Hub\nUse \`dh update\` to pull latest playbook.\nUse \`dh contribute "msg"\` to push new patterns back.\nAll shared knowledge lives in \`./${dir}/\`.`;

    if (!agentsContent.includes("Document Hub")) {
      fs.writeFileSync(agentsPath, agentsContent.trim() + instructions);
      console.log("✅ Added Document Hub section to AGENTS.md");
    }

    console.log("✅ Init complete!");
    console.log(`   git commit -m "chore: add dochub"`);
  });

program
  .command("update")
  .description("Pull latest from hub")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DOCH_DIR)
  .action((options) => {
    run(`git submodule update --remote --merge ${options.dir}`);
    console.log(`✅ Updated ${options.dir}/`);
  });

program
  .command("contribute")
  .description("Push changes back to hub")
  .argument("[message]", "Commit message", "Update from project")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DOCH_DIR)
  .action((message, options) => {
    const dir = options.dir;
    if (!fs.existsSync(path.join(dir, ".git"))) {
      console.error(`❌ ${dir}/ is not a submodule`);
      process.exit(1);
    }

    process.chdir(dir);
    run("git add -A");
    try {
      run(`git commit -m "${message}"`);
    } catch (e) {
      console.log("→ No changes");
    }
    run("git push origin main"); // ← change if you use different default branch

    process.chdir("..");
    run(`git add ${dir}`);
    run(`git commit -m "chore(docs): update hub (${message})"`);
    run("git push");

    console.log("✅ Contributed to hub");
  });

program
  .command("new-pattern")
  .description("Create new pattern file in doch/patterns/")
  .argument("<name>", "Pattern name (kebab-case)")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DOCH_DIR)
  .action((name, options) => {
    const dir = options.dir;
    const patternsDir = path.join(dir, "patterns");
    if (!fs.existsSync(patternsDir))
      fs.mkdirSync(patternsDir, { recursive: true });

    const filePath = path.join(patternsDir, `${name}.md`);
    const template = `# ${name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n\n## Context\n\n## Solution\n\n## Example\n\n`;

    fs.writeFileSync(filePath, template);
    console.log(`✅ Created ${filePath}`);
    console.log(`   cd ${dir} && code patterns/${name}.md`); // or your editor
  });

program
  .command("search")
  .description("Simple grep search in doch/")
  .argument("<query>", "Search term")
  .option("-d, --dir <name>", "Directory name", DEFAULT_DOCH_DIR)
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
