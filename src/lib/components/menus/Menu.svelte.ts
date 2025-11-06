import { GameManager } from '$lib/game/GameManger';
export interface MenuOption {
	label: string;
	action: () => void;
}
export class Menu {
	showMenu = $state(false);
	selectedOption = $state(0);
	title = 'Menu Gry';
	menuHint =
		'Użyj strzałek ↑↓ lub myszy do nawigacji • Enter lub kliknij aby wybrać • ESC aby wrócić';
	menuOptions: MenuOption[];

	constructor({
		menuOptions,
		onMenuClose,
		title,
		menuHint
	}: {
		menuOptions: MenuOption[];
		onMenuClose: () => void;
		title?: string;
		menuHint?: string;
	}) {
		this.title = title || this.title;
		this.menuHint = menuHint || this.menuHint;
		this.menuOptions = menuOptions;
		this.onMenuClose = onMenuClose;
	}

	onMenuClose: () => void;

	_boundEscapeKeyDown = () => {
		this.closeMenu();
	};
	_boundKeyUp = (e: KeyboardEvent) => {
		console.log('locking via esc');
		if (e.key === 'Escape') {
			this._boundEscapeKeyDown();
		}
	};
	_boundEnterKeyDown = () => {
		this.menuOptions[this.selectedOption].action();
	};
	_bundForwardKeyDown = () => {
		this.selectedOption =
			(this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
	};
	_boundDownKeyDown = () => {
		this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
	};

	openMenu() {
		this.showMenu = true;
		this.initListeners();
	}

	initListeners() {
		//make it via document to satisfy pointer lock api
		document.addEventListener('keyup', this._boundKeyUp);
		GameManager.instance.controlsManager.addEventListener('enterKeyDown', this._boundEnterKeyDown);
		GameManager.instance.controlsManager.addEventListener('upKeyDown', this._bundForwardKeyDown);
		GameManager.instance.controlsManager.addEventListener('downKeyDown', this._boundDownKeyDown);
	}
	disposeListeners() {
		document.removeEventListener('keyup', this._boundKeyUp);
		GameManager.instance.controlsManager.removeEventListener(
			'enterKeyDown',
			this._boundEnterKeyDown
		);
		GameManager.instance.controlsManager.removeEventListener('upKeyDown', this._bundForwardKeyDown);
		GameManager.instance.controlsManager.removeEventListener('downKeyDown', this._boundDownKeyDown);
	}
	closeMenu() {
		this.showMenu = false;
		this.disposeListeners();
		this.onMenuClose();
	}
}
