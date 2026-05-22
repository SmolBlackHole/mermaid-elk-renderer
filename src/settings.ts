import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type MermaidElkRendererPlugin from "./main";
import { BUNDLED_MERMAID_VERSION, DEFAULT_SETTINGS } from "./settings-data";

const REPOSITORY_URL = "https://github.com/SmolBlackHole/mermaid-elk-renderer";
const ISSUE_TRACKER_URL = "https://github.com/SmolBlackHole/mermaid-elk-renderer/issues/new/choose";
const MERMAID_DOCS_URL = "https://mermaid.js.org/intro/";

export class MermaidElkRendererSettingTab extends PluginSettingTab {
    plugin: MermaidElkRendererPlugin;

    constructor(app: App, plugin: MermaidElkRendererPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const restartWarningEl = containerEl.createDiv({ cls: "mermaid-elk-settings-warning" });
        restartWarningEl.createDiv({
            cls: "mermaid-elk-settings-warning-title",
            text: "Restart Obsidian after changing settings",
        });
        restartWarningEl.createDiv({
            cls: "mermaid-elk-settings-warning-body",
            text: "Settings may not apply reliably until Obsidian is restarted.",
        });

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

        new Setting(containerEl).setName("Styling").setHeading();

        new Setting(containerEl)
            .setName("Default Mermaid look")
            .setDesc("Optional default look for routed diagrams. Existing diagram config wins if present.")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("", "Preserve existing")
                    .addOption("classic", "Classic")
                    .addOption("handDrawn", "Hand drawn")
                    .setValue(this.plugin.settings.defaultMermaidLook)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultMermaidLook = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Default Mermaid theme")
            .setDesc("Optional default theme for routed diagrams. Existing frontmatter still takes priority.")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("", "Preserve existing")
                    .addOption("default", "Default")
                    .addOption("neutral", "Neutral")
                    .addOption("dark", "Dark")
                    .addOption("forest", "Forest")
                    .addOption("base", "Base")
                    .setValue(this.plugin.settings.defaultMermaidTheme)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultMermaidTheme = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName("Danger zone").setHeading();

        const dangerZoneEl = containerEl.createDiv({ cls: "mermaid-elk-danger-zone" });
        dangerZoneEl.createDiv({
            cls: "mermaid-elk-danger-zone-title",
            text: "Do not touch unless you know what you're doing",
        });
        dangerZoneEl.createDiv({
            cls: "mermaid-elk-danger-zone-body",
            text: "Regex overrides live here. If everything already works, this section is mostly a trap with form controls.",
        });

        new Setting(dangerZoneEl)
            .setName("Ordered label regex")
            .setDesc("Regex used to detect numbered list markers inside labels. Advanced. Mildly cursed.")
            .addTextArea((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.orderedListMarkerPattern)
                    .setValue(this.plugin.settings.orderedListMarkerPattern)
                    .onChange(async (value) => {
                        this.plugin.settings.orderedListMarkerPattern = value.trim() || DEFAULT_SETTINGS.orderedListMarkerPattern;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(dangerZoneEl)
            .setName("Ordered label replacement")
            .setDesc("Replacement used for detected numbered labels.")
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.orderedListReplacement)
                    .setValue(this.plugin.settings.orderedListReplacement)
                    .onChange(async (value) => {
                        this.plugin.settings.orderedListReplacement = value || DEFAULT_SETTINGS.orderedListReplacement;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(dangerZoneEl)
            .setName("Quoted label regex")
            .setDesc("Regex used to find quoted Mermaid labels before replacements are applied.")
            .addTextArea((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.quotedLabelPattern)
                    .setValue(this.plugin.settings.quotedLabelPattern)
                    .onChange(async (value) => {
                        this.plugin.settings.quotedLabelPattern = value.trim() || DEFAULT_SETTINGS.quotedLabelPattern;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(dangerZoneEl)
            .setName("Bracket label regex")
            .setDesc("Regex used to find bracket-style Mermaid labels before replacements are applied.")
            .addTextArea((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.bracketLabelPattern)
                    .setValue(this.plugin.settings.bracketLabelPattern)
                    .onChange(async (value) => {
                        this.plugin.settings.bracketLabelPattern = value.trim() || DEFAULT_SETTINGS.bracketLabelPattern;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName("Experimental").setHeading();

        const bundledMermaidNoticeEl = containerEl.createDiv({ cls: "mermaid-elk-settings-warning" });
        bundledMermaidNoticeEl.createDiv({
            cls: "mermaid-elk-settings-warning-title",
            text: `Use bundled Mermaid ${BUNDLED_MERMAID_VERSION} to load a newer Mermaid version`,
        });
        bundledMermaidNoticeEl.createDiv({
            cls: "mermaid-elk-settings-warning-body",
            text: "This option makes the plugin load the newer Mermaid runtime from the plugin itself instead of Obsidian's older bundled Mermaid. Use it when examples from the official Mermaid docs do not work in plain Obsidian yet.",
        });

        new Setting(containerEl)
            .setName("Use bundled Mermaid 11")
            .setDesc(`Load Mermaid ${BUNDLED_MERMAID_VERSION} from this plugin instead of Obsidian's bundled Mermaid. This is the option to enable for newer Mermaid docs examples.`)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.useBundledMermaid)
                    .onChange(async (value) => {
                        this.plugin.settings.useBundledMermaid = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Official Mermaid docs")
            .setDesc("Open the Mermaid documentation for newer diagram types, syntax, and examples.")
            .addButton((button) =>
                button
                    .setButtonText("Open Mermaid docs")
                    .onClick(() => {
                        window.open(MERMAID_DOCS_URL, "_blank", "noopener,noreferrer");
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

        new Setting(containerEl).setName("Support").setHeading();

        new Setting(containerEl)
            .setName("GitHub repository")
            .setDesc("View source code, releases, and documentation.")
            .addButton((button) =>
                button
                    .setButtonText("Open repository")
                    .onClick(() => {
                        window.open(REPOSITORY_URL, "_blank", "noopener,noreferrer");
                    })
            );

        new Setting(containerEl)
            .setName("Report an issue")
            .setDesc("Found a bug or have a request? Please open an issue in the repository.")
            .addButton((button) =>
                button
                    .setButtonText("Open issue tracker")
                    .setCta()
                    .onClick(() => {
                        window.open(ISSUE_TRACKER_URL, "_blank", "noopener,noreferrer");
                    })
            );

        new Setting(containerEl)
            .setName("Copy debug report")
            .setDesc("Copies current plugin settings and recent logs for pasting into an issue.")
            .addButton((button) =>
                button
                    .setButtonText("Copy report")
                    .onClick(async () => {
                        await this.plugin.copyDebugReportToClipboard();
                    })
            );
    }
}