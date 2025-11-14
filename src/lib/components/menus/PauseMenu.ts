//import { GameManager } from '$lib/game/GameManger';
import { GameManager } from '$lib/game/GameManger';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { SettingsMenu } from './SettingsMenu';
//import { SettingsMenu } from './SettingsMenu';

export class PauseMenu {
	private static _instance: Menu;

	static get instance(): Menu {
		if (!this._instance) {
			this._instance = new Menu({
				menuOptions: [
					new MenuOption({
						label: 'Wznów grę',
						action: () => {
							PauseMenu.instance.exitMenu();
						}
					}),
					new MenuOption({
						label: 'Ustawienia',
						action: () => {
							PauseMenu.instance.closeMenu();
							SettingsMenu.instance.openMenu();
						}
					})
					// { label: 'Osiągnięcia', action: () => console.log('Osiągnięcia clicked') },
					// { label: 'Zapisz i wyjdź', action: () => console.log('Zapisz i wyjdź clicked') },
					// {
					// 	label: 'Wyjdź bez zapisywania',
					// 	action: () => console.log('Wyjdź bez zapisywania clicked')
					// }
				],
				onMenuExit: () => {
					GameManager.instance.playerManager.controls.enterPointerLock();
				}
			});
		}
		return this._instance;
	}
}
