import { GameManager } from '$lib/game/GameManger';
import { MenuManager } from './MenuManager.svelte';
import type { MenuOption } from './MenuOption.svelte';
export class Menu {
	showMenu = $state(false);
	selectedOption = $state(0);
	title = 'Menu Gry';
	menuHint =
		'Użyj strzałek ↑↓ lub myszy do nawigacji • Enter lub kliknij aby wybrać • ESC aby wrócić';
	menuOptions: MenuOption[] = $state([]);

	static initializeStorageForMenu(menu: Menu) {
		menu.menuOptions.forEach((option) => {
			option.loadFromLocalStorage();
		});
	}

	constructor({
		menuOptions,
		onMenuClose,
		onMenuExit,
		title,
		menuHint
	}: {
		menuOptions: MenuOption[];
		onMenuClose?: () => void;
		onMenuExit?: () => void;
		title?: string;
		menuHint?: string;
	}) {
		this.title = title || this.title;
		this.menuHint = menuHint || this.menuHint;
		this.menuOptions = menuOptions;
		this.onMenuClose = onMenuClose;
		this.onMenuExit = onMenuExit;
	}

	onMenuClose?: () => void;
	onMenuExit?: () => void;
	onInitialize?: () => void;

	initialize() {
		return this.onInitialize?.();
	}

	exitMenu() {
		this.closeMenu();
		this.onMenuExit?.();
	}

	_boundEscapeKeyDown = () => {
		this.exitMenu();
	};
	_boundKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			this._boundEscapeKeyDown();
		}
	};
	_boundEnterKeyDown = () => {
		this.menuOptions[this.selectedOption].action();
	};
	_bundForwardKeyDown = () => {
		if (!this.menuOptions?.length) return;
		const len = this.menuOptions.length;
		this.selectedOption = (this.selectedOption - 1 + len) % len;
	};
	_boundDownKeyDown = () => {
		if (!this.menuOptions?.length) return;
		const len = this.menuOptions.length;
		this.selectedOption = (this.selectedOption + 1) % len;
	};

	openMenu() {
		this.showMenu = true;
		this.initListeners();
		MenuManager.instance._openMenu(this);
	}

	initListeners() {
		//make it via document to satisfy pointer lock api
		document.addEventListener('keyup', this._boundKeyUp);
		const controls = GameManager.instance.controlsManager;
		controls.addEventListener('enterKeyDown', this._boundEnterKeyDown);
		controls.addEventListener('upKeyDown', this._bundForwardKeyDown);
		controls.addEventListener('downKeyDown', this._boundDownKeyDown);
	}
	disposeListeners() {
		document.removeEventListener('keyup', this._boundKeyUp);
		const controls = GameManager.instance.controlsManager;
		controls.removeEventListener('enterKeyDown', this._boundEnterKeyDown);
		controls.removeEventListener('upKeyDown', this._bundForwardKeyDown);
		controls.removeEventListener('downKeyDown', this._boundDownKeyDown);
	}
	closeMenu() {
		if (this.showMenu) {
			MenuManager.instance._closeActiveMenu();
			this.showMenu = false;
			this.disposeListeners();
			this.onMenuClose?.();
		}
	}
}
