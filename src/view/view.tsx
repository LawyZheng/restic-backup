import { App, WorkspaceLeaf, ItemView } from "obsidian";
import { createContext } from "react";
import { ViewApp } from "src/view/components/ViewApp";
import { Root, createRoot } from "react-dom/client";
import { Restic } from "src/restic/restic";

export const RESTIC_BACKUP_VIEW_CONFIG = {
    type: 'restic-backup-view',
    name: 'Restic Backup',
    icon: '',
}

export const AppContext = createContext<App | undefined>(undefined);

export class ResticBackupView extends ItemView {
    private root: Root | null = null;
    private restic: Restic| undefined = undefined;

	constructor(leaf: WorkspaceLeaf, restic: Restic| undefined) {
		super(leaf);
        this.restic = restic
	}

	getViewType(): string {
        return RESTIC_BACKUP_VIEW_CONFIG.type;
    }

    getDisplayText(): string {
        return RESTIC_BACKUP_VIEW_CONFIG.name;
    }

    // getIcon(): string {
    //     return SOURCE_CONTROL_VIEW_CONFIG.icon;
    // }

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
            <AppContext.Provider value={this.app}>
				<ViewApp restic={this.restic} />
            </AppContext.Provider>
		);
	}

    async onClose() {
        this.root?.unmount();
    }
}