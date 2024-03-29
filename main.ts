import { App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { SettingTab, ResticSettings } from 'src/settings/settings'
import { ResticBackupView, RESTIC_BACKUP_VIEW_CONFIG } from 'src/view/view';
import { Restic } from 'src/restic/restic'
import { getVaultAbsolutePath } from 'src/util/path'
import { CronJob } from 'cron';
import { DateTime } from 'luxon'

// Remember to rename these classes and interfaces!
export default class MyPlugin extends Plugin {
	settings: ResticSettings
	restic: Restic | undefined
	statusBar: HTMLElement
	intervalTaskId: number
	cron: CronJob<null, null>

	async onload() {
		addEventListener("backup-success", this.setStatusBar.bind(this));

		await this.loadSettings();
		await this.loadAndCheckRestic()
		this.loadCronJob()
		this.loadView()
		this.loadRibbon()
		this.loadStatusBar()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: async () => {
				const leafs = this.app.workspace.getLeavesOfType('my-plugin-view')
				let leaf: WorkspaceLeaf | null | undefined;
				if (leafs.length === 0) {
					leaf = this.app.workspace.getRightLeaf(false);
					await leaf?.setViewState({
						type: 'my-plugin-view'
					})
				}else{
					leaf = leafs.first()
				}
				if (!leaf) {
					return
				}

				this.app.workspace.revealLeaf(leaf);
				// new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)
		// );

	}

	onunload() {
		this.app.workspace.detachLeavesOfType(RESTIC_BACKUP_VIEW_CONFIG.type);
	}

	setCronJob(minute: number) {
		if (this.intervalTaskId) {
			window.clearInterval(this.intervalTaskId)
			this.intervalTaskId = 0
			console.log('interval task cleared.')
		}

		this.intervalTaskId = window.setInterval(() => {
			if (this.settings.auto) {
				console.log('interval executed!')
				this.cron.fireOnTick()
			}
		}, minute * 60 * 1000)
		// console.log('interval task id: ', this.intervalTaskId)

		this.registerInterval(this.intervalTaskId)
	}

	async loadSettings() {
		this.settings = Object.assign(new ResticSettings(), await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		await this.loadAndCheckRestic()
	}

	async doBackUp() {
		if (!this.restic) {
			throw 'restic not configured!'
		}

		await this.restic.backup()
	}

	async loadAndCheckRestic() {
		if (!this.settings.check()) {
			this.restic = undefined
			return
		}
		const vault = getVaultAbsolutePath(this.app)
		const restic = new Restic(this.settings, vault)
		try{
			await restic.version()
		} catch(error) {
			this.restic = undefined
			new Notice('invalid restic binary')
			return
		}

		if (!restic.isRepo()) {
			new Notice('target path is not a valid repository')
			this.restic = undefined
			return
		}
		this.restic = restic
	}

	async activateView() {
		const leafs = this.app.workspace.getLeavesOfType(RESTIC_BACKUP_VIEW_CONFIG.type)
		let leaf: WorkspaceLeaf | null | undefined;
		if (leafs.length === 0) {
			leaf = this.app.workspace.getRightLeaf(false);
			await leaf?.setViewState({
				type: RESTIC_BACKUP_VIEW_CONFIG.type,
				active: true,
			})
		}else{
			leaf = leafs.first()
		}
		if (!leaf) {
			return
		}
		this.app.workspace.revealLeaf(leaf);
	}

	setStatusBar() {
		this.statusBar.setText("last backup: " + DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'))
	}

	loadCronJob() {
		this.cron = CronJob.from({
			cronTime:'* * * * * *',
			onTick: async ()=>{
				await this.doBackUp()
				// console.log("backuped")
				dispatchEvent(new CustomEvent("backup-success"));
			},
		})

		this.setCronJob(this.settings.interval)
	}

	loadRibbon() {
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			// new Notice('This is a notice!');
			this.activateView()
		
			// new Notice('starting backup...')
			// this.doBackUp()
			// 	.then(()=> {
			// 		new Notice('backup successfully!!')
			// 		this.setStatusBar()
			// 	})
			// 	.catch((error)=>{
			// 		new Notice(error)
			// 	})
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');
	}

	loadStatusBar() {
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		this.statusBar = statusBarItemEl
		this.statusBar.setText('last backup: no backup since started')
	}

	loadView() {
		this.registerView(RESTIC_BACKUP_VIEW_CONFIG.type, (leaf) => {
			return new ResticBackupView(leaf, this.restic)
		})
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

