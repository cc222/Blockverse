import { GameManager } from '$lib/game/GameManger';
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
							this.instance.exitMenu();
						}
					}),
					new MenuOption({
						label: 'Ustawienia interfejsu',
						action: () => {
							this.instance.closeMenu();
							InterfaceSettingMenu.instance.openMenu();
						}
					}),
					new MenuOption({
						label: 'Wyjdź',
						action: () => {
							this.instance.closeMenu();
							GameManager.instance.controlsManager.EnterPointerLock();
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
