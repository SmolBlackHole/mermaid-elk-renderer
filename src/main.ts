import { Notice, Platform, Plugin } from "obsidian";
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

    buildDebugReport() {
        const appVersion = this.tryGetAppVersion();
        const lines = this.logger
            .getRecentEntries(120)
            .map((entry) => {
                const scope = entry.scope ? `[${entry.scope}] ` : "";
                const details = entry.details ? ` ${this.stringifyDetails(entry.details)}` : "";
                return `${entry.timestamp} ${entry.level.toUpperCase()} ${scope}${entry.message}${details}`;
            });

        return [
            "### Mermaid ELK Renderer debug report",
            "",
            `- Plugin version: ${this.manifest.version}`,
            `- Obsidian version: ${appVersion}`,
            `- Runtime: ${this.getPlatformLabel()}`,
            "",
            "#### Current settings",
            "```json",
            JSON.stringify(this.settings, null, 2),
            "```",
            "",
            "#### Recent logs",
            "```text",
            ...(lines.length ? lines : ["(no recent logs captured)"]),
            "```",
        ].join("\n");
    }

    async copyDebugReportToClipboard() {
        const report = this.buildDebugReport();
        const copied = await this.copyTextToClipboard(report);
        if (copied) {
            new Notice("Debug report copied. Paste it into your GitHub issue.");
            this.logger.debug("copied debug report to clipboard", { length: report.length });
            return;
        }

        this.logger.warn("clipboard copy failed, showing fallback notice");
        new Notice("Could not copy debug report automatically. Open console logs and copy manually.");
    }

    private async copyTextToClipboard(text: string): Promise<boolean> {
        const clipboard = window.navigator?.clipboard;
        if (!clipboard?.writeText) {
            this.logger.warn("clipboard API unavailable");
            return false;
        }

        try {
            await clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    }

    private tryGetAppVersion() {
        const appWithVersion = this.app as unknown as { version?: unknown };
        return typeof appWithVersion.version === "string" ? appWithVersion.version : "unknown";
    }

    private getPlatformLabel() {
        const flags: string[] = [];
        if (Platform.isDesktopApp) flags.push("desktop");
        if (Platform.isMobileApp) flags.push("mobile");
        if (Platform.isIosApp) flags.push("ios");
        if (Platform.isAndroidApp) flags.push("android");

        return flags.length ? flags.join(", ") : "unknown";
    }

    private stringifyDetails(details: Record<string, unknown>) {
        try {
            return JSON.stringify(details);
        } catch {
            return "[unserializable details]";
        }
    }
}