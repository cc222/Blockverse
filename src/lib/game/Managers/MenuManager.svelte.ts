import { DebugMenu } from '../../components/menus/DebugMenu';
import { InterfaceSettingMenu } from '../../components/menus/InterfaceSettingMenu';
import { Menu } from '../../components/menus/Menu.svelte';
import { PauseMenu } from '../../components/menus/PauseMenu';
import { SettingsMenu } from '../../components/menus/SettingsMenu';
import { BaseManager } from './BaseManager';
import { ControlsManager } from './ControlsManager';

export class MenuManager extends BaseManager {
	private menus = [
		PauseMenu.instance,
		SettingsMenu.instance,
		InterfaceSettingMenu.instance,
		DebugMenu.instance
	];

	activeMenu = $state<Menu | null>(null);

	onEscapeKeyUp = () => {
		if (this.activeMenu) {
			this.activeMenu.exitMenu();
		} else {
			PauseMenu.instance.openMenu();
		}
	};

	public constructor(private controlsManager: ControlsManager) {
		super();
		this.initializeAndLoadFromStorageAllMenus();
		this.controlsManager.addEventListener('escapeKeyUp', this.onEscapeKeyUp);
	}

	protected async onDestroy(): Promise<void> {
		this.controlsManager.removeEventListener('escapeKeyUp', this.onEscapeKeyUp);
	}

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
			menu.initializeFromStorage();
		}
	}
}
