import { afterEach, describe, expect, it, vi } from "vitest";
import { PluginLogger } from "../src/logger";

afterEach(() => vi.restoreAllMocks());

describe("PluginLogger", () => {
    it("keeps diagnostics without printing debug or info when logging is disabled", () => {
        const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
        const logger = new PluginLogger(() => "Mermaid ELK Renderer", () => false);

        logger.debug("startup");
        logger.info("ready");

        expect(output).not.toHaveBeenCalled();
        expect(logger.getRecentEntries().map((entry) => entry.message)).toEqual(["startup", "ready"]);
    });

    it("prints debug output only while enabled", () => {
        const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
        let enabled = false;
        const logger = new PluginLogger(() => "plugin", () => enabled).child("renderer");

        logger.debug("hidden");
        enabled = true;
        logger.debug("visible", { provider: "bundled" });

        expect(output).toHaveBeenCalledExactlyOnceWith("plugin:renderer: visible", { provider: "bundled" });
    });

    it("keeps warnings and errors visible when debug logging is disabled", () => {
        const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const logger = new PluginLogger(() => "plugin", () => false);

        logger.warn("render failed");
        logger.error("patch failed");

        expect(warning).toHaveBeenCalledExactlyOnceWith("plugin: render failed");
        expect(error).toHaveBeenCalledExactlyOnceWith("plugin: patch failed");
    });

    it("shares a bounded report buffer between scopes", () => {
        const logger = new PluginLogger(() => "plugin", () => false);
        const child = logger.child("renderer");
        for (let index = 0; index < 405; index++) child.debug(String(index));

        const entries = logger.getRecentEntries(500);
        expect(entries).toHaveLength(400);
        expect(entries[0]).toMatchObject({ message: "5", scope: "renderer" });
        expect(entries[399]).toMatchObject({ message: "404", scope: "renderer" });
    });
});
