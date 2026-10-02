import fc from "fast-check";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUNDLED_MERMAID_VERSION, DEFAULT_SETTINGS, normalizeSettings } from "../src/settings-data";

describe("release metadata", () => {
	it("keeps package, manifest, lockfile, and compatibility map synchronized", () => {
		const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8")) as {
			version: string;
			minAppVersion: string;
		};
		const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
		const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")) as {
			version: string;
			packages: Record<string, { version: string }>;
		};
		const versions = JSON.parse(readFileSync(new URL("../versions.json", import.meta.url), "utf8")) as Record<string, string>;
		expect(pkg.version).toBe(manifest.version);
		expect(lock.version).toBe(manifest.version);
		expect(lock.packages[""].version).toBe(manifest.version);
		expect(versions[manifest.version]).toBe(manifest.minAppVersion);
	});
});

describe("bundled Mermaid version", () => {
	it("matches the locked runtime used by the production build", () => {
		const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")) as {
			packages: Record<string, { version: string }>;
		};
		expect(BUNDLED_MERMAID_VERSION).toBe(lock.packages["node_modules/mermaid"].version);
	});
});

describe("normalizeSettings", () => {
	it("returns defaults for missing or invalid data", () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings("invalid")).toEqual(DEFAULT_SETTINGS);
	});

	it("keeps valid saved values and trims marker text", () => {
		expect(normalizeSettings({
			debugLogging: true,
			escapeOrderedListLabels: false,
			markerText: "  elk+beta  ",
			applyElkToAllDiagrams: true,
			overrideExistingLayout: false,
			defaultMermaidLook: "  handDrawn  ",
			defaultMermaidTheme: "  neutral  ",
			quotedLabelPattern: "  \"(.+?)\"  ",
			bracketLabelPattern: "  \\[(.+?)\\]  ",
			orderedListMarkerPattern: "  (^|<br\\s*\\/?>)(\\s*)(\\d+)\\.(?=\\s)  ",
			orderedListReplacement: "$1$2$3\\u200B.",
			useBundledMermaid: true,
		})).toEqual({
			debugLogging: true,
			escapeOrderedListLabels: false,
			markerText: "elk+beta",
			applyElkToAllDiagrams: true,
			overrideExistingLayout: false,
			defaultMermaidLook: "handDrawn",
			defaultMermaidTheme: "neutral",
			quotedLabelPattern: "\"(.+?)\"",
			bracketLabelPattern: "\\[(.+?)\\]",
			orderedListMarkerPattern: "(^|<br\\s*\\/?>)(\\s*)(\\d+)\\.(?=\\s)",
			orderedListReplacement: "$1$2$3\\u200B.",
			useBundledMermaid: true,
		});
	});

	it("falls back per invalid field", () => {
		expect(normalizeSettings({
			debugLogging: "yes",
			escapeOrderedListLabels: true,
			markerText: "   ",
			applyElkToAllDiagrams: false,
			overrideExistingLayout: "no",
			defaultMermaidLook: 123,
			defaultMermaidTheme: null,
			quotedLabelPattern: "   ",
			bracketLabelPattern: 123,
			orderedListMarkerPattern: null,
			orderedListReplacement: 123,
			useBundledMermaid: "yes",
		})).toEqual({
			...DEFAULT_SETTINGS,
			escapeOrderedListLabels: true,
			applyElkToAllDiagrams: false,
		});
	});

	it("returns valid settings for arbitrary JSON values", () => {
		fc.assert(fc.property(fc.jsonValue(), (data) => {
			const settings = normalizeSettings(data);

			expect(typeof settings.debugLogging).toBe("boolean");
			expect(typeof settings.escapeOrderedListLabels).toBe("boolean");
			expect(typeof settings.applyElkToAllDiagrams).toBe("boolean");
			expect(typeof settings.overrideExistingLayout).toBe("boolean");
			expect(typeof settings.useBundledMermaid).toBe("boolean");
			expect(settings.markerText).toBe(settings.markerText.trim());
			expect(settings.markerText).not.toBe("");
			expect(settings.quotedLabelPattern).not.toBe("");
			expect(settings.bracketLabelPattern).not.toBe("");
			expect(settings.orderedListMarkerPattern).not.toBe("");
			expect(settings.orderedListReplacement).not.toBe("");
		}));
	});
});
