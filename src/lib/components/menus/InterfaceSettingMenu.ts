import { GameManager } from '$lib/game/GameManger';
import { Menu } from './Menu.svelte';
import { MenuOption } from './MenuOption.svelte';
import { SettingsMenu } from './SettingsMenu';

export class InterfaceSettingMenu {
	private static _instance: Menu;
	private static readonly positionLabels = {
		'Lewy Górny róg ekranu': 'top-left',
		'Prawy Górny róg ekranu': 'top-right',
		'Lewy Dolny róg ekranu': 'bottom-left',
		'Prawy Dolny róg ekranu': 'bottom-right'
	} as const;
	private static fpsStatsOptions = [
		new MenuOption({
			label: 'Wyswietlaj licznik FPS w',
			action: (option) => {
				if (!option) return;
				GameManager.instance.statsOverlayManager.position =
					this.positionLabels[option as keyof typeof this.positionLabels];
				GameManager.instance.statsOverlayManager.updateStyles();
			},
			options: [
				'Lewy Górny róg ekranu',
				'Prawy Górny róg ekranu',
				'Lewy Dolny róg ekranu',
				'Prawy Dolny róg ekranu'
			]
		})
	];
	static get instance(): Menu {
		if (!this._instance) {
			this._instance = new Menu({
				menuOptions: [
					new MenuOption({
						label: 'Wyswietlaj licznik FPS',
						action: (option) => {
							if (option === 'Włączony') {
								GameManager.instance.statsOverlayManager.isEnabled = true;
								this._instance.menuOptions.push(...this.fpsStatsOptions);
							} else {
								GameManager.instance.statsOverlayManager.isEnabled = false;
								this._instance.menuOptions = this._instance.menuOptions.filter(
									(item) => !this.fpsStatsOptions.includes(item)
								);
							}
							GameManager.instance.statsOverlayManager.updateStyles();
						},
						options: ['Włączony', 'Wyłączony']
					}),
					...this.fpsStatsOptions
					//{ label: 'Powrót do głownego menu', action: () => InterfaceSetting.instance.closeMenu() },
					//{ label: 'Wyjdź', action: () => InterfaceSetting.instance.closeMenu() }
				],
				onMenuExit: () => {
					SettingsMenu.instance.openMenu();
				}
			});
		}
		return this._instance;
	}
}
