type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
    details?: Record<string, unknown>;
    level: LogLevel;
    message: string;
    scope?: string;
    timestamp: string;
};

type LoggerState = {
    entries: LogEntry[];
    maxEntries: number;
};

export class PluginLogger {
    private state: LoggerState;

    constructor(
        private pluginNameProvider: () => string,
        private enabledProvider: () => boolean,
        private scope?: string,
        state?: LoggerState,
    ) {
        this.state = state ?? {
            entries: [],
            maxEntries: 400,
        };
    }

    child(scope: string) {
        const combinedScope = this.scope ? `${this.scope}/${scope}` : scope;
        return new PluginLogger(this.pluginNameProvider, this.enabledProvider, combinedScope, this.state);
    }

    debug(message: string, details?: Record<string, unknown>) {
        this.write("debug", message, details);
    }

    info(message: string, details?: Record<string, unknown>) {
        this.write("info", message, details);
    }

    warn(message: string, details?: Record<string, unknown>) {
        this.write("warn", message, details);
    }

    error(message: string, details?: Record<string, unknown>) {
        this.write("error", message, details);
    }

    getRecentEntries(limit = 120): LogEntry[] {
        if (limit <= 0) return [];
        return this.state.entries.slice(-limit);
    }

    private write(level: LogLevel, message: string, details?: Record<string, unknown>) {
        this.pushEntry(level, message, details);
        if (!this.shouldPrint(level)) return;

        const prefix = this.scope
            ? `${this.pluginNameProvider()}:${this.scope}`
            : this.pluginNameProvider();

        const output = `${prefix}: ${message}`;

        if (level === "warn") {
            if (details) {
                console.warn(output, details);
                return;
            }

            console.warn(output);
            return;
        }

        if (level === "error") {
            if (details) {
                console.error(output, details);
                return;
            }

            console.error(output);
            return;
        }

        if (details) {
            console.log(output, details);
            return;
        }

        console.log(output);
    }

    private pushEntry(level: LogLevel, message: string, details?: Record<string, unknown>) {
        this.state.entries.push({
            details,
            level,
            message,
            scope: this.scope,
            timestamp: new Date().toISOString(),
        });

        if (this.state.entries.length > this.state.maxEntries) {
            this.state.entries.splice(0, this.state.entries.length - this.state.maxEntries);
        }
    }

    private shouldPrint(level: LogLevel) {
        if (level === "error") return true;
        if (level === "warn") return true;
        return this.enabledProvider();
    }
}