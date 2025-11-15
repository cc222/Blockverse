import { LocalStorageManager } from '$lib/localStorge/LocalStorageManager';
import type { MenuLocalStorageKeys } from '$lib/localStorge/menu/MenuLocalStorageKeys';

export class MenuOption {
	label: string;
	action: (option?: string) => void;
	selectedOptionIndex = $state<number | undefined>(undefined);
	selectedOption = $state<string | undefined>(undefined);
	options?: string[];
	localStorageKey: MenuLocalStorageKeys | undefined;
	callActionOnLoadFromLocalStorage = true;
	private loadedFromLocalStorage: boolean = false;

	constructor({
		label,
		action,
		options,
		localStorageKey
	}: {
		label: string;
		action: (option?: string) => void;
		options?: string[];
		localStorageKey?: MenuLocalStorageKeys;
	}) {
		this.label = label;
		this.action = action;
		this.options = options;
		this.localStorageKey = localStorageKey;
		if (this.options?.length) {
			this.selectedOptionIndex = 0;
			this.selectedOption = this.options[this.selectedOptionIndex];
		}
	}

	loadFromLocalStorage() {
		if (this.options?.length && !this.loadedFromLocalStorage) {
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
			this.action();
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
}
