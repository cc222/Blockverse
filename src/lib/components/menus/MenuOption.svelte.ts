import { LocalStorageManager } from '$lib/localStorge/LocalStorageManager';
import type { MenuLocalStorageKeys } from '$lib/localStorge/menu/MenuLocalStorageKeys';

export interface MenuOptionConfig {
	label: string;
	action: (option: string | undefined) => void;
	options?: string[];
	localStorageKey?: MenuLocalStorageKeys;
	isEnabled?: boolean;
	onRender?: (option: MenuOption) => void;
}

export class MenuOption {
	label: string;
	action: (option: string | undefined) => void;
	onRender?: (option: MenuOption) => void;
	selectedOptionIndex = $state<number | undefined>(undefined);
	selectedOption = $state<string | undefined>(undefined);
	options?: string[];
	localStorageKey: MenuLocalStorageKeys | undefined;
	callActionOnLoadFromLocalStorage = true;
	public isEnabled = $state(true);

	private loadedFromLocalStorage = false;
	private hasCalledOnManagerReady = false;

	constructor(config: MenuOptionConfig) {
		this.label = config.label;
		this.action = config.action;
		this.options = config.options;
		this.localStorageKey = config.localStorageKey;
		this.isEnabled = config.isEnabled ?? true;
		this.onRender = config.onRender;

		if (this.options?.length) {
			this.selectedOptionIndex = 0;
			this.selectedOption = this.options[this.selectedOptionIndex];
		}
	}

	loadFromLocalStorage() {
		if (this.isEnabled && this.options?.length && !this.loadedFromLocalStorage) {
			this.selectedOption = LocalStorageManager.getFromStorageOrDefault<string>(
				this.getLocalStorageKey(),
				this.options[0]
			);
			this.selectedOptionIndex = this.options.indexOf(this.selectedOption);
			if (this.callActionOnLoadFromLocalStorage) {
				this.action(this.selectedOption);
			}
			this.loadedFromLocalStorage = true;
		}
	}

	onClick() {
		if (this.options?.length) {
			this.changeSubOption(1);
		} else {
			this.action(undefined);
		}
	}

	private getLocalStorageKey(): string {
		return 'menuSetting_' + this.localStorageKey;
	}

	changeSubOption(direction: 1 | -1) {
		if (!this.options?.length) return;

		const len = this.options.length;
		const next = ((this.selectedOptionIndex ?? 0) + direction + len) % len;
		this.selectedOptionIndex = next;
		this.selectedOption = this.options[next];
		if (this.localStorageKey !== undefined) {
			LocalStorageManager.saveToStorage(this.getLocalStorageKey(), this.selectedOption);
		}
		this.action(this.selectedOption);
	}

	destroy() {
		// Cleanup jeśli potrzebne
	}
}
