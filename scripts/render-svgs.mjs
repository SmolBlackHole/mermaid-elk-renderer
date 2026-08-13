import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import process from "node:process";

const SRC = resolve("assets/prerendered-src");
const OUT = resolve("assets/prerendered");
const META = resolve("assets/prerendered-meta.json");
const EXAMPLES_DOC = resolve("docs/mermaid-11-examples.md");
const BUNDLED_VERSION = "11.16.1";

function renderSvgs() {
    if (!existsSync(SRC)) {
        process.stderr.write(`Source dir not found: ${SRC}\n`);
        process.exit(1);
    }

    mkdirSync(OUT, { recursive: true });

    const files = readdirSync(SRC).filter((f) => extname(f) === ".mmd");
    if (!files.length) {
        process.stdout.write("No .mmd files found.\n");
        return 0;
    }

    let ok = 0;
    for (const file of files) {
        const input = join(SRC, file);
        const output = join(OUT, file.replace(/\.mmd$/, ".svg"));
        try {
            execSync(`npx mmdc -i "${input}" -o "${output}" -b transparent`, { stdio: "pipe" });
            ok++;
        } catch (err) {
            process.stderr.write(`Failed: ${file} — ${err.stderr?.toString().trim() || err.message}\n`);
        }
    }

    process.stdout.write(`Rendered ${ok}/${files.length} SVGs.\n`);
    return ok;
}

function readSource(id) {
    const path = join(SRC, `${id}.mmd`);
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf-8").trim();
}

function generateExamplesDoc(meta) {
    const showcase = meta.showcase || [];
    if (!showcase.length) {
        process.stderr.write("No showcase entries in metadata.\n");
        return false;
    }

    const items = showcase
        .map((item) => {
            const source = readSource(item.id);
            if (!source) {
                process.stderr.write(`Source not found for ${item.id}\n`);
                return null;
            }

            const needsBundled = item.needsBundledMermaid
                ? "\n> [!important] Bundled Mermaid required\n> This diagram type needs **Use bundled Mermaid 11** enabled."
                : "";

            return [
                `## ${item.title}`,
                "",
                `<!-- markdownlint-disable MD033 -->`,
                `<details>`,
                `<summary>${item.description}</summary>`,
                needsBundled,
                "",
                `![Prerendered ${item.title}](../assets/prerendered/${item.id}.svg)`,
                "",
                `\`\`\`\`markdown`,
                `\`\`\`mermaid`,
                source,
                `\`\`\``,
                `\`\`\`\``,
                "",
                `</details>`,
                `<!-- markdownlint-enable MD033 -->`,
                "",
            ].join("\n");
        })
        .filter(Boolean);

    const header = [
        "# Mermaid 11 example renders",
        "",
        "Back to the main guide: [README](../README.md)",
        "",
        "> [!info] Prerendered showcase",
        "> These diagrams are prerendered for GitHub and plain Markdown viewers.",
        `> To see them live in Obsidian, enable **Use bundled Mermaid 11** (loads Mermaid \`${BUNDLED_VERSION}\`).`,
        "> Official Mermaid docs: [mermaid.js.org](https://mermaid.js.org/intro/)",
        ">",
        "> Want copy-paste Markdown files? Grab them from the [examples/](../examples/) folder and open them in your vault.",
        "",
    ].join("\n");

    const footer = [
        "## Notes",
        "",
        "- Images are prerendered for portability. GitHub shows them even when it cannot run the plugin's Mermaid path.",
        "- Source snippets come from `assets/prerendered-src/` and are rendered via `npm run render-svgs`.",
        "- Newer diagram types need the bundled Mermaid runtime.",
        "- Copy the Markdown files from [examples/](../examples/) into your vault to test live with the plugin.",
        "",
    ].join("\n");

    const content = header + "\n" + items.join("\n") + footer;
    writeFileSync(EXAMPLES_DOC, content, "utf-8");
    process.stdout.write(`Generated ${EXAMPLES_DOC}\n`);
    return true;
}

// Main
if (!existsSync(META)) {
    process.stderr.write(`Metadata file not found: ${META}\n`);
    process.exit(1);
}

const meta = JSON.parse(readFileSync(META, "utf-8"));

const rendered = renderSvgs();
if (rendered > 0) {
    generateExamplesDoc(meta);
}

process.stdout.write("Done.\n");
