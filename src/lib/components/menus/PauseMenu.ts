import { GameState, MainManager } from '$lib/game/Managers/MainManager.svelte';
import { MenuManager } from '$lib/game/Managers/MenuManager.svelte';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { SettingsMenu } from './SettingsMenu';

export class PauseMenu {
	private static _instance: Menu;

	static get instance(): Menu {
		if (!this._instance) {
			const startGameOption = new MenuOption({
				label: 'Rozpocznij grę',
				onRender: (option) => {
					option.isEnabled = MainManager.instance.gameState === GameState.MAIN_MENU;
				},
				action: () => {
					MainManager.instance?.startGame();
					MenuManager.instance._closeActiveMenu();
				}
			});

			// Reaktywnie sprawdzaj czy gra jest włączona
			// $effect(() => {
			// 	startGameOption.isEnabled = !GameManager.isEnabled();
			// });

			this._instance = new Menu({
				menuOptions: [
					startGameOption,
					new MenuOption({
						label: 'Wznów grę',
						// Opcja widoczna tylko gdy gra jest włączona
						onRender: (option) => {
							option.isEnabled = MainManager.instance.gameState === GameState.IN_GAME;
						},
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
						// Opcja widoczna tylko gdy gra jest włączona
						onRender: (option) => {
							option.isEnabled = MainManager.instance.gameState === GameState.IN_GAME;
						},
						action: () => {
							MainManager.instance?.stopGame();
							PauseMenu.instance.closeMenu();
							MenuManager.instance._closeActiveMenu();
						}
					})
				],
				onMenuExit: () => {
					this.instance.gameManager?.gameControlsManager.enterPointerLock();
				}
			});
		}
		return this._instance;
	}
}
