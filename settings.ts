import { App, PluginSettingTab, Setting, Plugin, Notice } from 'obsidian'
import { ResticBinary, Restic } from './restic'
import { getVaultAbsolutePath } from './util'

export class ResticSettings {
	auto: boolean;
	interval: number;

	resticBin: string;
	repo: string;
	password: string;

	constructor(bin='', repo='', password='obsidian', auto=false, interval=5) {
		this.resticBin = bin
		this.repo = repo
		this.password = password
		this.auto = auto
		this.interval = interval
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
	setCronJob(minute: number): void
}

export class SettingTab extends PluginSettingTab {
	private resticSetting: ResticSettings

	private versionEl: Setting
	private repoEl: Setting
	private resticVersion: string

	plugin: PluginInterface;

	constructor(app: App, plugin: PluginInterface) {
		super(app, plugin);
		this.plugin = plugin
		this.resticSetting = new ResticSettings(
			plugin.settings.resticBin, 
			plugin.settings.repo, 
			plugin.settings.password, 
			plugin.settings.auto,
			plugin.settings.interval,
		)
	}

	private setResticVersion(): void {
		this.resticSetting.getResticBinary().version()
			.then((v: string) => {
				this.versionEl.setDesc("Restic version: " + v)
				this.resticVersion = v
				if (!this.resticSetting.check()) {
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
		const _setting = this.resticSetting

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
					this.resticSetting.resticBin = value
				}))
			.addButton(btn => btn
				.setButtonText('Detect')
				.onClick(async _evt => {
					this.setResticVersion()
					this.plugin.settings.resticBin = this.resticSetting.resticBin
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
					this.resticSetting.repo = value
				}));

		new Setting(containerEl)
			.setName('Password')
			.setDesc('password to access restic repo')
			.addText(text => text
				.setValue(this.plugin.settings.password)
				.onChange((value) => {
					this.resticSetting.password = value
				}))
			.setHeading();

		this.repoEl = new Setting(containerEl)
			.setDesc('Repository status: unknown')
			.addButton(btn => btn
				.setButtonText('Confrim')
				.onClick(async _evt => {
					this.checkRepo()
					this.plugin.settings.password = this.resticSetting.password
					this.plugin.settings.repo = this.resticSetting.repo
					await this.plugin.saveSettings()
				})
			)
			.setHeading()
		
	    new Setting(containerEl)
			.setName('Backup Interval')
			.setDesc('interval minutes of auto backup')
			.addDropdown(drop => drop
				.addOptions(
					{
						'1': '1 mins',
						'5': '5 mins',
						'10': '10 mins',
						'30': '30 mins',
						'60': '60 mins',
					},
				)
				.setValue(this.plugin.settings.interval.toString())
				.onChange(async (value) =>{
					const minutes = parseInt(value)
					this.plugin.settings.interval = minutes 
					await this.plugin.saveSettings()
					this.plugin.setCronJob(minutes)
				})
			)

			new Setting(containerEl)
			.setName('Enable Auto Backup')
			.setDesc('turn on/off auto backup')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.auto)
				.onChange(async (value)=>{
					this.plugin.settings.auto = value
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
