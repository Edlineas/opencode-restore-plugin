/**
 * OpenCode Restore Plugin
 *
 * Provides Trae/Kiro-like message undo and file restore functionality
 */
export declare const RestorePlugin: ({ app, client, $ }: {
    app: any;
    client: any;
    $: any;
}) => Promise<{
    event: ({ event }: {
        event: any;
    }) => Promise<void>;
    command: {
        execute: {
            before: (input: any, output: any) => Promise<void>;
        };
    };
}>;
export default RestorePlugin;
//# sourceMappingURL=plugin.d.ts.map