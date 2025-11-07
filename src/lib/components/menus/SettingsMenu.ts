import { InterfaceSettingMenu } from './InterfaceSettingMenu';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { PauseMenu } from './PauseMenu';

export class SettingsMenu {
	private static _instance: Menu;
	static get instance(): Menu {
		if (!this._instance) {
			this._instance = new Menu({
				menuOptions: [
					new MenuOption({
						label: 'Powrót do głownego menu',
						action: () => {
							PauseMenu.instance.exitMenu();
						}
					}),
					new MenuOption({
						label: 'Ustawienia interfejsu',
						action: () => {
							SettingsMenu.instance.closeMenu();
							InterfaceSettingMenu.instance.openMenu();
						}
					}),
					new MenuOption({
						label: 'Wyjdź',
						action: () => {
							PauseMenu.instance.exitMenu();
						}
					})
				],
				onMenuExit: () => {
					PauseMenu.instance.openMenu();
				}
			});
		}
		return this._instance;
	}
}
