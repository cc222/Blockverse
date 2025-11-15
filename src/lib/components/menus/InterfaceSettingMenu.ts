import { GameManager } from '$lib/game/GameManger';
import { EStatsPosition } from '$lib/game/Managers/StatsOverlayManager';
import { MenuLocalStorageKeys } from '$lib/localStorge/menu/MenuLocalStorageKeys';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { SettingsMenu } from './SettingsMenu';

export class InterfaceSettingMenu {
	private static _instance: Menu;
	private static readonly positionLabels = {
		'Lewy Górny róg ekranu': EStatsPosition.TOP_LEFT,
		'Prawy Górny róg ekranu': EStatsPosition.TOP_RIGHT,
		'Lewy Dolny róg ekranu': EStatsPosition.BOTTOM_LEFT,
		'Prawy Dolny róg ekranu': EStatsPosition.BOTTOM_RIGHT
	} as const;
	static get instance(): Menu {
		if (!this._instance) {
			{
				const fpsStatsOptions = [
					new MenuOption({
						label: 'Wyswietlaj licznik FPS w',
						action: (option) => {
							if (!option) return;
							if (GameManager.instance.statsOverlayManager) {
								GameManager.instance.statsOverlayManager.position =
									this.positionLabels[option as keyof typeof this.positionLabels];
								GameManager.instance.statsOverlayManager.updateStyles();
							}
						},
						options: [
							'Lewy Górny róg ekranu',
							'Prawy Górny róg ekranu',
							'Lewy Dolny róg ekranu',
							'Prawy Dolny róg ekranu'
						],
						localStorageKey: MenuLocalStorageKeys.LocationOfFPS
					})
				];

				this._instance = new Menu({
					menuOptions: [
						new MenuOption({
							label: 'Powrót do ustawień',
							action: () => {
								this.instance.exitMenu();
							}
						}),
						new MenuOption({
							label: 'Wyswietlaj licznik FPS',
							action: (option) => {
								if (GameManager.instance.statsOverlayManager) {
									if (option === 'Włączony') {
										if (GameManager.instance.statsOverlayManager) {
											GameManager.instance.statsOverlayManager.isEnabled = true;
											this._instance.menuOptions.splice(2, 0, ...fpsStatsOptions);
											for (const menu of fpsStatsOptions) {
												menu.loadFromLocalStorage();
											}
										}
									} else {
										GameManager.instance.statsOverlayManager.isEnabled = false;
										this._instance.menuOptions = this._instance.menuOptions.filter(
											(item) => !fpsStatsOptions.includes(item)
										);
									}
									GameManager.instance.statsOverlayManager.updateStyles();
								}
							},
							options: ['Wyłączony', 'Włączony'],
							localStorageKey: MenuLocalStorageKeys.IsShowFPS
						}),
						new MenuOption({
							label: 'Wyjdź',
							action: () => {
								this.instance.closeMenu();
								GameManager.instance.playerManager.controls.enterPointerLock();
							}
						})
						//{ label: 'Powrót do głownego menu', action: () => InterfaceSetting.instance.closeMenu() },
						//{ label: 'Wyjdź', action: () => InterfaceSetting.instance.closeMenu() }
					],
					onMenuExit: () => {
						SettingsMenu.instance.openMenu();
					}
				});
			}
		}
		return this._instance;
	}
}
