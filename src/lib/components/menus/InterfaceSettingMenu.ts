import { EStatsPosition, StatsOverlayManager } from '$lib/game/Managers/StatsOverlayManager';
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
				const fpsPositionOption = new MenuOption({
					label: 'Wyswietlaj licznik FPS w',
					dependsOn: StatsOverlayManager,
					action: (option, statsOverlayManager) => {
						if (!option || !statsOverlayManager) return;
						statsOverlayManager.position =
							this.positionLabels[option as keyof typeof this.positionLabels];
						statsOverlayManager.updateStyles();
					},
					options: [
						'Lewy Górny róg ekranu',
						'Prawy Górny róg ekranu',
						'Lewy Dolny róg ekranu',
						'Prawy Dolny róg ekranu'
					],
					localStorageKey: MenuLocalStorageKeys.LocationOfFPS,
					isEnabled: false
				});
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
							dependsOn: StatsOverlayManager,
							action: (option, statsOverlayManager) => {
								if (statsOverlayManager) {
									if (option === 'Włączony') {
										statsOverlayManager.isEnabled = true;
										fpsPositionOption.isEnabled = true;
										fpsPositionOption.loadFromLocalStorage();
									} else {
										statsOverlayManager.isEnabled = false;
										fpsPositionOption.isEnabled = false;
									}
									statsOverlayManager.updateStyles();
								}
							},
							options: ['Wyłączony', 'Włączony'],
							localStorageKey: MenuLocalStorageKeys.IsShowFPS
						}),
						fpsPositionOption,
						new MenuOption({
							label: 'Wyjdź',
							action: () => {
								this.instance.closeMenu();
								this.instance.gameManager?.gameControlsManager.enterPointerLock();
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
