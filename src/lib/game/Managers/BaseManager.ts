/* eslint-disable @typescript-eslint/no-explicit-any */

// Symbol keys for storing per-class data directly on constructor
const IS_ENABLED = Symbol('isEnabled');
const INSTANCE = Symbol('instance');

export interface ManagerConstructor {
	[IS_ENABLED]?: boolean;
	[INSTANCE]?: BaseManager;
}

export abstract class BaseManager {
	protected constructor() {}

	/**
	 * Override this method for per-instance initialization logic.
	 * Called when enable() is called.
	 */
	// protected async onEnable(): Promise<void> {
	// 	// Default: do nothing - override in subclasses
	// }

	/**
	 * Override this method for per-instance cleanup logic.
	 * Called when disable() is called.
	 */
	// protected async onDisable(): Promise<void> {
	// 	// Default: do nothing - override in subclasses
	// }

	/** Get enabled state for this specific class */
	// private static getIsEnabled(ctor: ManagerConstructor): boolean {
	// 	return ctor[IS_ENABLED] ?? false;
	// }

	// /** Set enabled state for this specific class */
	// private static setIsEnabled(ctor: ManagerConstructor, value: boolean): void {
	// 	ctor[IS_ENABLED] = value;
	// }

	/** Get instance for this specific class */
	private static getInstanceInternal(ctor: ManagerConstructor): BaseManager | undefined {
		return ctor[INSTANCE];
	}

	/** Set instance for this specific class */
	private static setInstance(ctor: ManagerConstructor, instance: BaseManager | undefined): void {
		ctor[INSTANCE] = instance;
	}

	/** Check if manager is enabled */
	// public static isEnabled(): boolean {
	// 	const ctor = this as ManagerConstructor;
	// 	return BaseManager.getIsEnabled(ctor);
	// }

	// public async enable(): Promise<void> {
	// 	this.onEnable();
	// }

	// public async disable(): Promise<void> {
	// 	this.onDisable();
	// }

	/** Enable the manager */
	// public static async enable(): Promise<void> {
	// 	const ctor = this as ManagerConstructor;

	// 	if (BaseManager.getIsEnabled(ctor)) return;

	// 	BaseManager.setIsEnabled(ctor, true);

	// 	const instance = BaseManager.getInstanceInternal(ctor);
	// 	if (instance) {
	// 		await instance.onEnable();
	// 	}
	// }

	/** Disable the manager */
	// public static async disable(): Promise<void> {
	// 	const ctor = this as ManagerConstructor;

	// 	if (!BaseManager.getIsEnabled(ctor)) return;

	// 	BaseManager.setIsEnabled(ctor, false);

	// 	const instance = BaseManager.getInstanceInternal(ctor);
	// 	if (instance) {
	// 		await instance.onDisable();
	// 	}
	// }

	protected async onDestroy(): Promise<void> {
		// Default: do nothing - override in subclasses
	}

	public async destroy(): Promise<void> {
		this.onDestroy();
		const ctor = this as ManagerConstructor;
		BaseManager.setInstance(ctor, undefined);
	}

	/** Destroy the manager and clear instance */
	public static async destroy(): Promise<void> {
		const ctor = this as ManagerConstructor;

		const instance = BaseManager.getInstanceInternal(ctor);
		if (instance) {
			await instance.onDestroy();
		}
		BaseManager.setInstance(ctor, undefined);
	}

	/** Fully type-safe singleton */
	public static createInstance<Args extends unknown[], T extends BaseManager>(
		this: { new (...args: Args): T } & ManagerConstructor,
		...args: Args
	): T {
		const existingInstance = BaseManager.getInstanceInternal(this);

		if (!existingInstance) {
			const newInstance = new this(...args);
			BaseManager.setInstance(this, newInstance);
			return newInstance;
		}

		return existingInstance as T;
	}

	/** Access static instance directly (for Svelte reactivity) */
	public static get instance(): any {
		const ctor = this as ManagerConstructor;
		return BaseManager.getInstanceInternal(ctor);
	}
}
