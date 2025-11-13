import { DebugMenu } from './DebugMenu';
import { InterfaceSettingMenu } from './InterfaceSettingMenu';
import { Menu } from './Menu.svelte';
import { PauseMenu } from './PauseMenu';
import { SettingsMenu } from './SettingsMenu';

export class MenuManager {
	private static _instance?: MenuManager;

	private menus = [
		PauseMenu.instance,
		SettingsMenu.instance,
		InterfaceSettingMenu.instance,
		DebugMenu.instance
	];

	activeMenu = $state<Menu | null>(null);

	static get instance(): MenuManager {
		if (!this._instance) {
			this._instance = new MenuManager();
		}
		return this._instance;
	}

	private constructor() {}
	/**
	 * Otwórz konkretne menu
	 */
	_openMenu(menu: Menu) {
		if (this.activeMenu) {
			this.activeMenu.closeMenu();
		}
		this.activeMenu = menu;
	}

	/**
	 * Zamknij aktywne menu
	 */
	_closeActiveMenu() {
		if (this.activeMenu) {
			this.activeMenu = null;
		}
	}

	/**
	 * Sprawdź czy jakieś menu jest otwarte
	 */
	get isAnyMenuOpen(): boolean {
		return this.activeMenu !== null && this.activeMenu.showMenu;
	}

	initializeAndLoadFromStorageAllMenus() {
		for (const menu of this.menus) {
			Menu.initializeStorageForMenu(menu);
		}
	}
}
