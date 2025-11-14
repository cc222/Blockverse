import { GameManager } from '$lib/game/GameManger';
import { setDebugAtlasIsEnabled } from '$lib/game/textures/textureAtlas';
import { MenuLocalStorageKeys } from '$lib/localStorge/menu/MenuLocalStorageKeys';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { SettingsMenu } from './SettingsMenu';

export class DebugMenu {
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
						label: 'Atlas texture',
						action: (option) => {
							if (option === 'Włączony') {
								setDebugAtlasIsEnabled(true);
							} else {
								setDebugAtlasIsEnabled(false);
							}
						},
						options: ['Wyłączony', 'Włączony'],
						localStorageKey: MenuLocalStorageKeys.TextureAtlas
					}),
					new MenuOption({
						label: 'Wyjdź',
						action: () => {
							this.instance.closeMenu();
							GameManager.instance.playerManager.controls.enterPointerLock();
						}
					})
				],
				onMenuExit: () => {
					SettingsMenu.instance.openMenu();
				}
			});
		}
		return this._instance;
	}
}
