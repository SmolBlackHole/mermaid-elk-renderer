import { App, MarkdownView } from "obsidian";
import { PluginLogger } from "./logger";

export class MarkdownPreviewRefresher {
    private refreshTimer: number | null = null;

    constructor(private app: App, private logger: PluginLogger) { }

    queue(reason = "settings change", delayMs = 120) {
        this.cancelQueuedRefresh();
        this.logger.debug("queued preview refresh", { delayMs, reason });

        this.refreshTimer = window.setTimeout(() => {
            this.refreshTimer = null;
            this.refreshNow(`${reason} (delayed)`);
        }, delayMs);
    }

    cancelQueuedRefresh() {
        if (this.refreshTimer === null) return;

        window.clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
        this.logger.debug("canceled queued preview refresh");
    }

    refreshNow(reason = "manual refresh") {
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        let refreshedLeaves = 0;

        for (const leaf of leaves) {
            const view = leaf.view;
            if (!(view instanceof MarkdownView)) continue;

            const previewMode = view.previewMode as unknown as { rerender?: (force?: boolean) => void };
            if (typeof previewMode.rerender !== "function") continue;

            previewMode.rerender(true);
            refreshedLeaves++;
        }

        this.logger.debug("refreshed markdown previews", { reason, refreshedLeaves });
    }
}