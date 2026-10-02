import { beforeEach, describe, expect, it, vi } from "vitest";
import { Setting, type SettingDefinitionGroup, type SettingGroup } from "obsidian";
import type MermaidElkRendererPlugin from "../src/main";
import { MermaidElkRendererSettingTab } from "../src/settings";
import { DEFAULT_SETTINGS } from "../src/settings-data";

const state = vi.hoisted(() => ({
	modern: true,
	buttons: [] as { text: string; methods: string[]; click?: () => void | Promise<void> }[],
	empty: vi.fn(),
	update: vi.fn(),
}));

vi.mock("obsidian", () => {
	const container = { empty: state.empty, createDiv: () => container };
	class MockSetting {
		setName() { return this; }
		setDesc() { return this; }
		setHeading() { return this; }
		addButton(callback: (button: object) => unknown) {
			const record: typeof state.buttons[number] = { text: "", methods: [] };
			const control: object = new Proxy({}, {
				get: (_target, method: string) => (...args: unknown[]) => {
					record.methods.push(method);
					if (method === "setButtonText") record.text = args[0] as string;
					if (method === "onClick") record.click = args[0] as () => void | Promise<void>;
					return control;
				},
			});
			callback(control);
			state.buttons.push(record);
			return this;
		}
		addToggle() { return this; }
		addText() { return this; }
		addTextArea() { return this; }
		addDropdown() { return this; }
	}
	return {
		Setting: MockSetting,
		Notice: class { },
		requireApiVersion: () => state.modern,
		PluginSettingTab: class {
			containerEl = container;
			update = state.update;
		},
	};
});

beforeEach(() => {
	state.modern = true;
	state.buttons.length = 0;
	vi.clearAllMocks();
});

function createTab() {
	const plugin = {
		settings: { ...DEFAULT_SETTINGS, markerText: "custom", debugLogging: true },
		saveSettings: vi.fn().mockResolvedValue(undefined),
		debugSettings: vi.fn(),
	};
	const tab = new MermaidElkRendererSettingTab(
		{} as ConstructorParameters<typeof MermaidElkRendererSettingTab>[0],
		plugin as unknown as MermaidElkRendererPlugin,
	);
	return { tab, plugin };
}

function renderResetButton(tab: MermaidElkRendererSettingTab) {
	const support = tab.getSettingDefinitions().find((item): item is SettingDefinitionGroup =>
		"type" in item && item.type === "group" && item.heading === "Support"
	);
	if (!support?.items) throw new Error("Missing support group");
	const reset = support.items.find((item) => "name" in item && item.name === "Reset settings");
	if (!reset || !("render" in reset) || !reset.render) throw new Error("Missing reset button");
	reset.render(new Setting({} as HTMLElement), {} as SettingGroup);
	return state.buttons.find((button) => button.text === "Reset")!;
}

describe("settings compatibility", () => {
	it("uses the destructive button API and refreshes declarative settings on Obsidian 1.13+", async () => {
		const { tab, plugin } = createTab();
		const button = renderResetButton(tab);
		expect(button.methods).toContain("setDestructive");

		await button.click!();

		expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
		expect(plugin.saveSettings).toHaveBeenCalledOnce();
		expect(state.update).toHaveBeenCalledOnce();
		expect(state.empty).not.toHaveBeenCalled();
	});

	it("does not call the new destructive API when it is unavailable", () => {
		state.modern = false;
		const { tab } = createTab();
		expect(renderResetButton(tab).methods).not.toContain("setDestructive");
	});

	it("resets and rerenders the legacy tab without invoking newer or deprecated APIs", async () => {
		state.modern = false;
		const { tab, plugin } = createTab();
		const legacyHostTab: { display(): void } = tab;
		legacyHostTab.display();
		const button = state.buttons.find((entry) => entry.text === "Reset")!;
		expect(button.methods).toContain("setClass");
		expect(button.methods).not.toContain("setWarning");
		expect(button.methods).not.toContain("setDestructive");

		await button.click!();

		expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
		expect(plugin.saveSettings).toHaveBeenCalledOnce();
		expect(state.empty).toHaveBeenCalledTimes(2);
		expect(state.update).not.toHaveBeenCalled();
	});
});
