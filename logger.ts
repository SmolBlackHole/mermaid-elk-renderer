export class PluginLogger {
    constructor(
        private pluginNameProvider: () => string,
        private enabledProvider: () => boolean,
        private scope?: string,
    ) { }

    child(scope: string) {
        const combinedScope = this.scope ? `${this.scope}/${scope}` : scope;
        return new PluginLogger(this.pluginNameProvider, this.enabledProvider, combinedScope);
    }

    debug(message: string, details?: Record<string, unknown>) {
        if (!this.enabledProvider()) return;

        const prefix = this.scope
            ? `${this.pluginNameProvider()}:${this.scope}`
            : this.pluginNameProvider();

        if (details) {
            console.log(`${prefix}: ${message}`, details);
            return;
        }

        console.log(`${prefix}: ${message}`);
    }
}