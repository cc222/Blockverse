import { ControlsManager } from '$lib/game/Managers/ControlsManager';
import { GameManager } from '$lib/game/Managers/GameManger';
import { MainManager } from '$lib/game/Managers/MainManager';
import type { IMenuOption } from './MenuOption.svelte';
export class Menu {
	showMenu = $state(false);
	selectedOption = $state(0);
	title = 'Menu Gry';
	menuHint =
		'Użyj strzałek ↑↓ lub myszy do nawigacji • Enter lub kliknij aby wybrać • ESC aby wrócić';
	menuOptions: IMenuOption[] = $state([]);
	controlsManager?: ControlsManager;
	gameManager?: GameManager;

	initializeFromStorage() {
		this.menuOptions.forEach((option) => {
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
		menuOptions: IMenuOption[];
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
		ControlsManager.afterInitialization((instance) => {
			this.controlsManager = instance;
		});
		GameManager.afterInitialization((instance) => {
			this.gameManager = instance;
		});
		GameManager.onDestroy(() => {
			this.gameManager = undefined;
		});
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
	_boundEnterKeyDown = () => {
		this.menuOptions[this.selectedOption].onClick();
	};

	_moveSelection = (direction: 1 | -1) => {
		if (!this.menuOptions?.length) return;
		const len = this.menuOptions.length;
		if (len === 0) return;

		let currentIndex = this.selectedOption;
		for (let i = 0; i < len; i++) {
			currentIndex = (((currentIndex + direction) % len) + len) % len;

			const option = this.menuOptions[currentIndex];
			if (option && option.isEnabled) {
				this.selectedOption = currentIndex;
				return;
			}
		}
	};

	_bundForwardKeyDown = () => {
		this._moveSelection(-1);
	};
	_boundDownKeyDown = () => {
		this._moveSelection(1);
	};

	openMenu() {
		this.showMenu = true;
		this.initListeners();
		//temp xd
		this._moveSelection(-1);
		this._moveSelection(1);
		MainManager.instance.menuManager._openMenu(this);
	}

	initListeners() {
		this.controlsManager?.addEventListener('enterKeyDown', this._boundEnterKeyDown);
		this.controlsManager?.addEventListener('forwardKeyDown', this._bundForwardKeyDown);
		this.controlsManager?.addEventListener('backwardKeyDown', this._boundDownKeyDown);
	}
	disposeListeners() {
		this.controlsManager?.removeEventListener('enterKeyDown', this._boundEnterKeyDown);
		this.controlsManager?.removeEventListener('forwardKeyDown', this._bundForwardKeyDown);
		this.controlsManager?.removeEventListener('backwardKeyDown', this._boundDownKeyDown);
	}
	closeMenu() {
		if (this.showMenu) {
			MainManager.instance.menuManager._closeActiveMenu();
			this.showMenu = false;
			this.disposeListeners();
			this.onMenuClose?.();
		}
	}
}
