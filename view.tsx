import { WorkspaceLeaf, ItemView } from "obsidian";
import { StrictMode } from "react";
import { ReactView } from "./ReactView";
import { Root, createRoot } from "react-dom/client";

export const RESTIC_BACKUP_VIEW_CONFIG = {
    type: 'restic-backup-view',
    name: 'Restic Backup',
    icon: '',
}

export class ResticBackupView extends ItemView {
    root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
			<StrictMode>
				<ReactView/>
			</StrictMode>
		);
		// const container = this.containerEl.children[1];
		// container.empty();
		// container.createEl("h4", { text: "Example view" });
	}

    async onClose() {
        this.root?.unmount();
    }
}