//import { GameManager } from '$lib/game/GameManger';
import { GameManager } from '$lib/game/Managers/GameManger';
import { MainManager } from '$lib/game/Managers/MainManager';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { SettingsMenu } from './SettingsMenu';
//import { SettingsMenu } from './SettingsMenu';

export class PauseMenu {
	private static _instance: Menu;

	static get instance(): Menu {
		if (!this._instance) {
			const startGameOption = new MenuOption({
				label: 'Rozpocznij grę',
				action: () => {
					MainManager.instance.startGame();
				}
			});
			GameManager.afterInitialization(() => {
				startGameOption.isEnabled = false;
			});
			GameManager.onDestroy(() => {
				startGameOption.isEnabled = true;
			});
			this._instance = new Menu({
				menuOptions: [
					startGameOption,
					new MenuOption({
						label: 'Wznów grę',
						//@ts-expect-error todo make valid typings
						dependsOn: GameManager,
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
					}),
					new MenuOption({
						label: 'Wyjdź z gry',
						//@ts-expect-error todo make valid typings
						dependsOn: GameManager,
						action: () => {
							MainManager.instance.stopGame();
							PauseMenu.instance.closeMenu();
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
					this.instance.gameManager?.gameControlsManager.enterPointerLock();
				}
			});
		}
		return this._instance;
	}
}
