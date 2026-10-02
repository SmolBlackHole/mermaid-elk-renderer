const { readFileSync, writeFileSync } = require("node:fs");

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
	console.error("Usage: node scripts/convert-gantt-bce-to-unix.js input.mmd output.mmd");
	process.exit(1);
}

if (inputPath === outputPath) {
	console.error("Choose a separate output path so the source diagram is preserved.");
	process.exit(1);
}

function toUnixTimestamp(year) {
	const date = new Date(0);
	date.setUTCFullYear(year, 0, 1);
	date.setUTCHours(0, 0, 0, 0);
	return Math.trunc(date.getTime() / 1000);
}

const source = readFileSync(inputPath, "utf8");
let foundGantt = false;
let foundDateFormat = false;
let converted = 0;

const lines = source.split(/\r?\n/).map((line) => {
	if (/^\s*gantt\s*$/i.test(line)) foundGantt = true;

	if (/^(\s*)dateFormat\s+/i.test(line)) {
		foundDateFormat = true;
		return line.replace(/^(\s*)dateFormat\s+.*/i, "$1dateFormat X");
	}

	const match = line.match(/^(\s*.*?:\s*[^,]+,\s*)(-\d+)(\s*,\s*)(\d+)y(\s*)$/);
	if (!match) return line;

	const [, prefix, startYearText, , durationText, suffix] = match;
	const startYear = Number.parseInt(startYearText, 10);
	const endYear = startYear + Number.parseInt(durationText, 10);

	converted++;
	return `${prefix}${toUnixTimestamp(startYear)}, ${toUnixTimestamp(endYear)}${suffix}`;
});

if (!foundGantt) {
	throw new Error("Expected a Mermaid Gantt diagram.");
}

if (!foundDateFormat) {
	const ganttIndex = lines.findIndex((line) => /^\s*gantt\s*$/i.test(line));
	const indentation = lines[ganttIndex].match(/^(\s*)/)?.[1] ?? "";
	lines.splice(ganttIndex + 1, 0, `${indentation}    dateFormat X`);
}

if (converted === 0) {
	throw new Error("No negative-year tasks with a year duration were found.");
}

writeFileSync(outputPath, lines.join("\n"));
console.log(`Converted ${converted} Gantt task(s) to Unix timestamps: ${outputPath}`);
