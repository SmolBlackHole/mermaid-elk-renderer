import { Notice, Plugin } from "obsidian";
import { MermaidElkRendererSettingTab } from "./settings";
import { DEFAULT_SETTINGS, normalizeSettings, type MermaidElkRendererSettings } from "./settings-data";
import { MermaidProvider } from "./mermaid-provider";
import { MarkdownPreviewRefresher } from "./preview-refresh";
import { MermaidRendererPatch } from "./renderer-patch";
import { PluginLogger } from "./logger";

export default class MermaidElkRendererPlugin extends Plugin {
    settings: MermaidElkRendererSettings = { ...DEFAULT_SETTINGS };

    private mermaidProviderInstance: MermaidProvider | null = null;
    private previewRefresherInstance: MarkdownPreviewRefresher | null = null;
    private rendererPatchInstance: MermaidRendererPatch | null = null;
    private loggerInstance: PluginLogger | null = null;

    private get logger() {
        if (!this.loggerInstance) {
            this.loggerInstance = new PluginLogger(
                () => this.manifest.name,
                () => this.settings.debugLogging,
            );
        }

        return this.loggerInstance;
    }

    private get mermaidProvider() {
        if (!this.mermaidProviderInstance) {
            this.mermaidProviderInstance = new MermaidProvider(this.logger.child("provider"));
        }

        return this.mermaidProviderInstance;
    }

    private get previewRefresher() {
        if (!this.previewRefresherInstance) {
            this.previewRefresherInstance = new MarkdownPreviewRefresher(this.app, this.logger.child("preview"));
        }

        return this.previewRefresherInstance;
    }

    private get rendererPatch() {
        if (!this.rendererPatchInstance) {
            this.rendererPatchInstance = new MermaidRendererPatch(
                () => this.settings,
                this.logger.child("patch"),
                (message) => new Notice(message, 8000),
            );
        }

        return this.rendererPatchInstance;
    }

    async loadSettings() {
        const data: unknown = await this.loadData();
        this.settings = normalizeSettings(data);
        this.logger.debug("loaded settings", {
            applyElkToAllDiagrams: this.settings.applyElkToAllDiagrams,
            debugLogging: this.settings.debugLogging,
            markerText: this.settings.markerText,
            useBundledMermaid: this.settings.useBundledMermaid,
        });
    }

    async saveSettings() {
        const previousUseBundledMermaid = this.settings.useBundledMermaid;
        this.settings = normalizeSettings(this.settings);
        await this.saveData(this.settings);
        this.logger.debug("saved settings", {
            applyElkToAllDiagrams: this.settings.applyElkToAllDiagrams,
            debugLogging: this.settings.debugLogging,
            markerText: this.settings.markerText,
            useBundledMermaid: this.settings.useBundledMermaid,
        });

        if (this.rendererPatch.activeUseBundledMermaid !== null && this.rendererPatch.activeUseBundledMermaid !== this.settings.useBundledMermaid) {
            await this.installRendererPatch();
            this.previewRefresher.refreshNow("Mermaid provider toggled");
            this.previewRefresher.queue("Mermaid provider toggled", 280);
            return;
        }

        if (previousUseBundledMermaid !== this.settings.useBundledMermaid) {
            this.logger.debug("detected Mermaid provider change before patch activation", {
                from: previousUseBundledMermaid,
                to: this.settings.useBundledMermaid,
            });
        }

        this.previewRefresher.queue("settings change");
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new MermaidElkRendererSettingTab(this.app, this));

        this.logger.debug(`loading ${this.manifest.name} ${this.manifest.version}`);
        await this.installRendererPatch();
        this.previewRefresher.refreshNow("plugin enabled immediate");
        this.previewRefresher.queue("plugin enabled follow-up", 280);
    }

    onunload() {
        this.logger.debug(`unloading ${this.manifest.name} ${this.manifest.version}`);
        this.previewRefresher.cancelQueuedRefresh();
        const restored = this.rendererPatch.restore();
        this.previewRefresher.refreshNow(restored ? "plugin disabled after patch restore" : "plugin disabled without patch restore");
    }

    private async installRendererPatch() {
        const restoredBeforeInstall = this.rendererPatch.restore();
        this.logger.debug("starting renderer patch install", {
            restoredBeforeInstall,
            useBundledMermaid: this.settings.useBundledMermaid,
        });

        const selection = await this.mermaidProvider.select(this.settings.useBundledMermaid);
        this.rendererPatch.install(selection, this.settings.useBundledMermaid);
    }
}