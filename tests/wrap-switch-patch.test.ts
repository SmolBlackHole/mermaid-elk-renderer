import { describe, expect, it } from "vitest";
import { patchMermaidWrapSwitch } from "../scripts/lib/mermaid-wrap-switch-patch.mjs";

describe("patchMermaidWrapSwitch", () => {
	it("patches the minified chunk shape (dist/chunks/mermaid.esm.min)", () => {
		const minified =
			't&&l.attr("class","labelBkg"),(await $e.measure(()=>l.node().getBoundingClientRect()))' +
			'.width===n&&(l.style("display","table"),l.style("white-space","break-spaces"),' +
			'l.style("width",n+"px")),i.node()}';
		const { contents, count } = patchMermaidWrapSwitch(minified);

		expect(count).toBe(1);
		expect(contents).toContain(
			"Math.round((await $e.measure(()=>l.node().getBoundingClientRect())).width)===Math.round(n)&&",
		);
		expect(contents).not.toContain(".width===n&&(");
	});

	it("patches the unminified chunk shape (dist/chunks/mermaid.core)", () => {
		const source = [
			'  div.attr("class", "labelBkg");',
			"  }",
			"  const bbox = await fastdom_default.measure(() => div.node().getBoundingClientRect());",
			"  if (bbox.width === width) {",
			'    div.style("display", "table");',
			'    div.style("white-space", "break-spaces");',
			'    div.style("width", width + "px");',
			"  }",
		].join("\n");
		const { contents, count } = patchMermaidWrapSwitch(source);

		expect(count).toBe(1);
		expect(contents).toContain("if (Math.round(bbox.width) === Math.round(width)) {");
		expect(contents).not.toContain("if (bbox.width === width)");
		expect(contents).toContain(
			"const bbox = await fastdom_default.measure(() => div.node().getBoundingClientRect());",
		);
	});

	it("reports zero replacements for content without the wrap switch", () => {
		const { contents, count } = patchMermaidWrapSwitch(
			'const other = a.measure(() => b.width === c && d.style("display", "table"));',
		);
		expect(count).toBe(0);
		expect(contents).toBe('const other = a.measure(() => b.width === c && d.style("display", "table"));');
	});

	it("keeps the measured expression semantically identical", async () => {
		const minified =
			'(await fastdom.measure(()=>div.node().getBoundingClientRect())).width===width&&(' +
			'x.style("white-space","break-spaces"))';
		const { contents, count } = patchMermaidWrapSwitch(minified);

		expect(count).toBe(1);
		expect(contents).toBe(
			"Math.round((await fastdom.measure(()=>div.node().getBoundingClientRect())).width)" +
				'===Math.round(width)&&(x.style("white-space","break-spaces"))',
		);

		type RunFn = (fd: unknown, d: unknown, x: unknown, width: number) => Promise<boolean>;
		const asyncFnProto = Object.getPrototypeOf(async () => {}) as {
			constructor: new (...args: string[]) => RunFn;
		};
		const run = new asyncFnProto.constructor(
			"fastdom",
			"div",
			"x",
			"width",
			`return (${contents});`,
		);
		const div = { node: () => ({ getBoundingClientRect: () => ({ width: 199.6 }) }) };
		const styleCalls: unknown[][] = [];
		const x = {
			style: (...args: unknown[]) => {
				styleCalls.push(args);
				return true;
			},
		};
		const fastdom = { measure: (fn: () => unknown) => fn() };

		await expect(run(fastdom, div, x, 200)).resolves.toBe(true);
		await expect(run(fastdom, div, x, 150)).resolves.toBe(false);
		expect(styleCalls.length).toBe(1);
	});
});
