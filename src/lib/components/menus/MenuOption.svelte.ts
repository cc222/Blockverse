import { LocalStorageManager } from '$lib/localStorge/LocalStorageManager';

export class MenuOption {
	label: string;
	action: (option?: string) => void;
	selectedOptionIndex?: number = $state(undefined);
	selectedOption?: string = $state(undefined);
	options?: string[];
	localStorageKey?: string;

	constructor({
		label,
		action,
		options,
		localStorageKey
	}: {
		label: string;
		action: (option?: string) => void;
		options?: string[];
		localStorageKey?: string;
	}) {
		this.label = label;
		this.action = action;
		this.options = options;
		if (this.options?.length) {
			this.selectedOptionIndex = 0;
			this.selectedOption = this.options[this.selectedOptionIndex];
			if (localStorageKey) {
				this.localStorageKey = 'menuSetting_' + localStorageKey;
				this.selectedOption = LocalStorageManager.getFromStorageOrDefault<string>(
					this.localStorageKey,
					this.options[0]
				);
				this.selectedOptionIndex = this.options.indexOf(this.selectedOption);
				this.action(this.selectedOption);
			}
		}
	}

	onClick() {
		if (this.options?.length) {
			this.changeSubOption(1);
		} else {
			this.action();
		}
	}

	changeSubOption(direction: 1 | -1) {
		if (!this.options?.length) return;

		const len = this.options.length;
		const next = ((this.selectedOptionIndex ?? 0) + direction + len) % len;
		this.selectedOptionIndex = next;
		this.selectedOption = this.options[next];
		this.action(this.selectedOption);
	}
}
