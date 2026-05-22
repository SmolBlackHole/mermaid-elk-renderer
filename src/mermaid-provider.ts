import { loadMermaid } from "obsidian";
import bundledMermaid from "mermaid";
import bundledElkLayouts from "@mermaid-js/layout-elk";
import obsidianElkLayouts from "mermaid-layout-elk-obsidian";
import { BUNDLED_MERMAID_VERSION } from "./settings-data";
import { PluginLogger } from "./logger";
import type { MermaidLike, MermaidSelection } from "./mermaid-types";

export class MermaidProvider {
    constructor(private logger: PluginLogger) { }

    async select(useBundledMermaid: boolean): Promise<MermaidSelection> {
        const obsidianMermaid = await loadMermaid() as unknown as MermaidLike;
        if (!useBundledMermaid) {
            this.logger.debug("selected Mermaid provider", { source: "Obsidian Mermaid" });
            return {
                mermaid: obsidianMermaid,
                elkLayouts: obsidianElkLayouts,
                source: "Obsidian Mermaid",
            };
        }

        const experimentalMermaid = bundledMermaid as unknown as MermaidLike;
        this.configureBundledMermaid(experimentalMermaid, obsidianMermaid);
        this.logger.debug("selected Mermaid provider", {
            source: `bundled Mermaid ${BUNDLED_MERMAID_VERSION}`,
        });
        return {
            mermaid: experimentalMermaid,
            elkLayouts: bundledElkLayouts,
            restoreMermaid: obsidianMermaid,
            source: `bundled Mermaid ${BUNDLED_MERMAID_VERSION}`,
        };
    }

    private configureBundledMermaid(mermaid: MermaidLike, obsidianMermaid: MermaidLike) {
        const getConfig = obsidianMermaid.mermaidAPI?.getConfig;
        if (typeof mermaid.initialize !== "function" || typeof getConfig !== "function") return;

        try {
            mermaid.initialize(getConfig.call(obsidianMermaid.mermaidAPI));
            this.logger.debug("copied Obsidian Mermaid configuration to bundled Mermaid");
        } catch (error) {
            this.logger.debug("could not copy Obsidian Mermaid configuration to bundled Mermaid", { error });
        }
    }
}