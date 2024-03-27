import { App, FileSystemAdapter } from "obsidian"


export const getVaultAbsolutePath = (app: App): string => {
    const adapter = app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
        return adapter.getBasePath();
    }
    return '';
}