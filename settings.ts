import { App, PluginSettingTab, Setting, Plugin, Notice } from 'obsidian'
import { ResticBinary, Restic } from './restic'
import { getVaultAbsolutePath } from './util'

export class ResticSettings {
	resticBin: string;
	repo: string;
	password: string;

	constructor(bin='', repo='', password='obsidian') {
		this.resticBin = bin
		this.repo = repo
		this.password = password
	}

	check(): boolean {
		return this.resticBin != '' && 
				this.repo != '' &&
				this.password != ''
	}

	getResticBinary(): ResticBinary {
		return new ResticBinary(this.resticBin)
	}

	getResitc(vault: string): Restic {
		return new Restic(this, vault)
	}

}

interface PluginInterface extends Plugin {
	settings: ResticSettings
	saveSettings(): Promise<void>
}

export class SettingTab extends PluginSettingTab {
	private versionEl: Setting
	private repoEl: Setting
	private resticVersion: string
	private setting: ResticSettings

	plugin: PluginInterface;

	constructor(app: App, plugin: PluginInterface) {
		super(app, plugin);
		this.plugin = plugin
		this.setting = new ResticSettings(plugin.settings.resticBin, plugin.settings.repo, plugin.settings.password)
	}

	private setResticVersion(): void {
		this.setting.getResticBinary().version()
			.then((v: string) => {
				this.versionEl.setDesc("Restic version: " + v)
				this.resticVersion = v
				if (!this.setting.check()) {
					return
				}
				this.checkRepo()
			})
			.catch((err) => {
				console.error(err)
				this.versionEl.setDesc("Undetected Restic")
				this.resticVersion = ''
			})
	}

	private checkRepo(): void {
		const _setting = this.setting

		if (!this.resticVersion) {
			new Notice('not restic found')
			this.repoEl.setDesc('Repository status: missing restic binary')
			return
		}

		if (!_setting.password || !_setting.repo) {
			new Notice('empty repository/password')
			this.repoEl.setDesc('Repository status: missing repository/password')
			return
		}

		// check exist repo or not
		const vaultPath = getVaultAbsolutePath(this.app)
		const restic = _setting.getResitc(vaultPath)
        restic.initIfEmpty()
			.then(() => {
				new Notice('repository verified!')
				this.repoEl.setDesc('Repository status: OK')
			})
			.catch((error) => {
				new Notice(error)
				this.repoEl.setDesc('Repository status: error')
			})
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Restic Executable Path')
			.setDesc('the absolute path of restic binary.')
			.addText(text => text
				.setPlaceholder('eg: /usr/bin/restic')
				.setValue(this.plugin.settings.resticBin)
				.onChange((value) => {
					this.setting.resticBin = value
				}))
			.addButton(btn => btn
				.setButtonText('Detect')
				.onClick(async _evt => {
					this.setResticVersion()
					this.plugin.settings.resticBin = this.setting.resticBin
					await this.plugin.saveSettings()
				})
			);

		this.versionEl = new Setting(containerEl)
			.setHeading()
		


		new Setting(containerEl)
			.setName('Repository')
			.setDesc('path to save the backup data')
			.addText(text => text
				.setPlaceholder('eg: /myrepo')
				.setValue(this.plugin.settings.repo)
				.onChange((value) => {
					this.setting.repo = value
				}));

		new Setting(containerEl)
			.setName('Password')
			.setDesc('password to access restic repo')
			.addText(text => text
				.setValue(this.plugin.settings.password)
				.onChange((value) => {
					this.setting.password = value
				}))
			.setHeading();

		this.repoEl = new Setting(containerEl)
			.setDesc('Repository status: unknown')
			.addButton(btn => btn
				.setButtonText('Confrim')
				.onClick(async _evt => {
					this.checkRepo()
					this.plugin.settings.password = this.setting.password
					this.plugin.settings.repo = this.setting.repo
					await this.plugin.saveSettings()
				})
			)
			.setHeading()

		this.load()
	}

	load(): void {
		if (this.plugin.settings.resticBin) {
			this.setResticVersion()
		}
	}


}
