import { App, PluginSettingTab, Setting, Plugin } from 'obsidian'
import { ResticBinary } from './restic'
import { getVaultAbsolutePath } from './util'

interface PluginInterface extends Plugin {
	settings: ResticSettings
	saveSettings(): Promise<void>
}

export interface ResticSettings {
	resticBin: string;
	repo: string;
	password: string;
	version: string;

}

export const DEFAULT_SETTINGS: ResticSettings = {
	resticBin: '',
	repo: '',
	version: '',
	password: 'obsidian',
}

export class SettingTab extends PluginSettingTab {
	private versionEl: Setting

	plugin: PluginInterface;

	constructor(app: App, plugin: PluginInterface) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private setResticVersion(): void {
		try {
			const v = new ResticBinary(this.plugin.settings.resticBin).version()
			this.versionEl.setDesc("Restic version: " + v)
		}catch (error) {
			this.versionEl.setDesc("Undetected Restic")
		}
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Restic Executable Path')
			.setDesc('the absolute path of restic binary. version: ' + this.plugin.settings.version)
			.addText(text => text
				.setPlaceholder('eg: /usr/bin/restic')
				.setValue(this.plugin.settings.resticBin)
				.onChange(async (value) => {
					this.plugin.settings.resticBin = value;
					await this.plugin.saveSettings();
				}))
			.addButton(btn => btn
				.setButtonText('Detect')
				.onClick(_evt => {
					this.setResticVersion()
				})
			);

		this.versionEl = new Setting(containerEl)
			.setHeading()
		this.setResticVersion()

		new Setting(containerEl)
			.setName('Repository')
			.setDesc('path to save the backup data')
			.addText(text => text
				.setPlaceholder('eg: /myrepo')
				.setValue(this.plugin.settings.repo)
				.onChange(async (value) => {
					this.plugin.settings.repo = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Password')
			.setDesc('password to access restic repo')
			.addText(text => text
				.setValue(this.plugin.settings.password)
				.onChange(async (value) => {
					this.plugin.settings.password = value;
					await this.plugin.saveSettings();
				}))
			.setHeading();

	}
}
