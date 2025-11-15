import type { BaseManager } from '$lib/game/Managers/BaseManager';
import { LocalStorageManager } from '$lib/localStorge/LocalStorageManager';
import type { MenuLocalStorageKeys } from '$lib/localStorge/menu/MenuLocalStorageKeys';

export interface IMenuOption {
	label: string;
	selectedOptionIndex: number | undefined;
	selectedOption: string | undefined;
	options?: string[];
	localStorageKey: MenuLocalStorageKeys | undefined;
	callActionOnLoadFromLocalStorage: boolean;
	isEnabled: boolean;

	loadFromLocalStorage(): void;
	onClick(): void;
	changeSubOption(direction: 1 | -1): void;
	destroy(): void;
}

type ManagerConstructor<T extends BaseManager = BaseManager> = {
	new (...args: unknown[]): T;
	afterInitialization<U extends T>(
		this: ManagerConstructor<U>,
		cb: (instance: U) => void | Promise<void>
	): Promise<void>;
	onDestroy<U extends T>(
		this: ManagerConstructor<U>,
		cb: (instance: U) => void | Promise<void>
	): Promise<void>;
};

export interface MenuOptionConfig<T extends BaseManager = BaseManager> {
	label: string;
	action: (option: string | undefined, managerInstance: T | undefined) => void;
	options?: string[];
	localStorageKey?: MenuLocalStorageKeys;
	isEnabled?: boolean;

	// Pojedyncza zależność od managera
	dependsOn?: ManagerConstructor<T>;
	onManagerReady?: (instance: T, option: MenuOption<T>) => void;
	onManagerDestroy?: (instance: T, option: MenuOption<T>) => void;
}

export class MenuOption<T extends BaseManager = BaseManager> {
	label: string;
	action: (option: string | undefined, managerInstance: T | undefined) => void;
	selectedOptionIndex = $state<number | undefined>(undefined);
	selectedOption = $state<string | undefined>(undefined);
	options?: string[];
	localStorageKey: MenuLocalStorageKeys | undefined;
	callActionOnLoadFromLocalStorage = true;
	isEnabled = $state(true);

	// Pojedyncza instancja managera
	private managerInstance: T | undefined;
	private managerClass: ManagerConstructor<T> | undefined;
	private loadedFromLocalStorage = false;

	constructor(config: MenuOptionConfig<T>) {
		this.label = config.label;
		this.action = config.action;
		this.options = config.options;
		this.localStorageKey = config.localStorageKey;
		this.isEnabled = config.isEnabled ?? true;
		this.managerClass = config.dependsOn;

		if (this.options?.length) {
			this.selectedOptionIndex = 0;
			this.selectedOption = this.options[this.selectedOptionIndex];
		}

		// Jeśli ma zależność od managera - ustaw jako disabled i czekaj
		if (config.dependsOn) {
			this.isEnabled = false;
			this.setupDependency(config);
		}
	}

	private setupDependency(config: MenuOptionConfig<T>) {
		if (!config.dependsOn) return;

		// Gdy manager się zainicjalizuje - zapisz instancję i włącz opcję
		config.dependsOn.afterInitialization((instance) => {
			this.managerInstance = instance;
			this.isEnabled = true;

			config.onManagerReady?.(instance, this);
			this.loadFromLocalStorage();
		});

		// Gdy manager zostanie zniszczony - wyłącz opcję
		config.dependsOn.onDestroy((instance) => {
			config.onManagerDestroy?.(instance, this);
			this.managerInstance = undefined;
			this.isEnabled = false;
		});
	}

	loadFromLocalStorage() {
		if (this.isEnabled && this.options?.length && !this.loadedFromLocalStorage) {
			this.selectedOption = LocalStorageManager.getFromStorageOrDefault<string>(
				this.getLocalStorageKey(),
				this.options[0]
			);
			this.selectedOptionIndex = this.options.indexOf(this.selectedOption);
			if (this.callActionOnLoadFromLocalStorage) {
				this.action(this.selectedOption, this.managerInstance);
			}
			this.loadedFromLocalStorage = true;
		}
	}

	onClick() {
		if (this.options?.length) {
			this.changeSubOption(1);
		} else {
			this.action(undefined, this.managerInstance);
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
		this.action(this.selectedOption, this.managerInstance);
	}

	destroy() {
		this.managerInstance = undefined;
	}
}
