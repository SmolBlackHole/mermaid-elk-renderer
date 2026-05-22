import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type MermaidElkRendererPlugin from "./main";
import { DEFAULT_SETTINGS } from "./settings-data";

export class MermaidElkRendererSettingTab extends PluginSettingTab {
    plugin: MermaidElkRendererPlugin;

    constructor(app: App, plugin: MermaidElkRendererPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Debug logging")
            .setDesc("Log plugin startup, renderer patching, and elk routing decisions to the developer console.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.debugLogging)
                    .onChange(async (value) => {
                        this.plugin.settings.debugLogging = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Escape numbered labels")
            .setDesc("Prevent labels like '1. Step' from being interpreted as Markdown lists by Mermaid.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.escapeOrderedListLabels)
                    .onChange(async (value) => {
                        this.plugin.settings.escapeOrderedListLabels = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName("Advanced").setHeading();

        new Setting(containerEl)
            .setName("Marker text")
            .setDesc("Text used inside the Mermaid comment marker. The default marker is %% elk %%.")
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.markerText)
                    .setValue(this.plugin.settings.markerText)
                    .onChange(async (value) => {
                        this.plugin.settings.markerText = value.trim() || DEFAULT_SETTINGS.markerText;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Apply elk to all diagrams")
            .setDesc("Route every Mermaid diagram through elk, even when the marker is not present.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.applyElkToAllDiagrams)
                    .onChange(async (value) => {
                        this.plugin.settings.applyElkToAllDiagrams = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Override existing layout")
            .setDesc("Replace an existing Mermaid layout value with elk when a diagram is routed through this plugin.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.overrideExistingLayout)
                    .onChange(async (value) => {
                        this.plugin.settings.overrideExistingLayout = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Reset settings")
            .setDesc("Restore all plugin options to their defaults.")
            .addButton((button) =>
                button
                    .setButtonText("Reset")
                    .setWarning()
                    .onClick(async () => {
                        this.plugin.settings = { ...DEFAULT_SETTINGS };
                        await this.plugin.saveSettings();
                        new Notice("Settings reset.");
                        this.display();
                    })
            );
    }
}