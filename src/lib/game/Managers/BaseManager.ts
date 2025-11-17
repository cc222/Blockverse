/* eslint-disable @typescript-eslint/no-explicit-any */
type Callback<T = BaseManager> = (instance: T) => void | Promise<void>;

// Symbol keys for storing per-class data directly on constructor
const AFTER_INIT_CALLBACKS = Symbol('afterInitCallbacks');
const ON_DESTROY_CALLBACKS = Symbol('onDestroyCallbacks');
const IS_INITIALIZED = Symbol('isInitialized');
const IS_DESTROYED = Symbol('isDestroyed');
const INSTANCE = Symbol('instance');

export interface ManagerConstructor {
	[AFTER_INIT_CALLBACKS]?: Callback<any>[];
	[ON_DESTROY_CALLBACKS]?: Callback<any>[];
	[IS_INITIALIZED]?: boolean;
	[IS_DESTROYED]?: boolean;
	[INSTANCE]?: BaseManager;
}

export abstract class BaseManager {
	protected constructor() {}

	/**
	 * Override this method to register static callbacks for this class.
	 * Called only ONCE per class, not per instance.
	 */
	protected registerCallbacks(): void {
		// Domyślnie nic nie robi - nadpisz w podklasach
	}

	/**
	 * Override this method for per-instance initialization logic.
	 * Called every time initialize() is called for an instance.
	 */
	protected async onInitialize(): Promise<void> {
		// Domyślnie nic nie robi
	}

	/**
	 * Override this method for per-instance cleanup logic.
	 * Called every time destroy() is called for an instance.
	 */
	protected async onDestroy(): Promise<void> {
		// Domyślnie nic nie robi
	}

	/** Get or initialize afterInit callbacks array for this specific class */
	private static getAfterInitCallbacks(ctor: ManagerConstructor): Callback<any>[] {
		if (!ctor[AFTER_INIT_CALLBACKS]) {
			ctor[AFTER_INIT_CALLBACKS] = [];
		}
		return ctor[AFTER_INIT_CALLBACKS];
	}

	/** Get or initialize onDestroy callbacks array for this specific class */
	private static getOnDestroyCallbacks(ctor: ManagerConstructor): Callback<any>[] {
		if (!ctor[ON_DESTROY_CALLBACKS]) {
			ctor[ON_DESTROY_CALLBACKS] = [];
		}
		return ctor[ON_DESTROY_CALLBACKS];
	}

	/** Get initialization state for this specific class */
	private static getIsInitialized(ctor: ManagerConstructor): boolean {
		return ctor[IS_INITIALIZED] ?? false;
	}

	/** Set initialization state for this specific class */
	private static setIsInitialized(ctor: ManagerConstructor, value: boolean): void {
		ctor[IS_INITIALIZED] = value;
	}

	/** Get destruction state for this specific class */
	private static getIsDestroyed(ctor: ManagerConstructor): boolean {
		return ctor[IS_DESTROYED] ?? false;
	}

	/** Set destruction state for this specific class */
	private static setIsDestroyed(ctor: ManagerConstructor, value: boolean): void {
		ctor[IS_DESTROYED] = value;
	}

	/** Get instance for this specific class */
	private static getInstance_internal(ctor: ManagerConstructor): BaseManager | undefined {
		return ctor[INSTANCE];
	}

	//only for svelte
	public static instance? = (this as ManagerConstructor)[INSTANCE];

	/** Set instance for this specific class */
	private static setInstance(ctor: ManagerConstructor, instance: BaseManager | undefined): void {
		ctor[INSTANCE] = instance;
	}

	/** Register a callback to run after initialization */
	public static async afterInitialization<T extends BaseManager>(
		this: { new (...args: any[]): T } & ManagerConstructor,
		cb: Callback<T>
	): Promise<void> {
		const callbacks = BaseManager.getAfterInitCallbacks(this);
		callbacks.push(cb);

		if (BaseManager.getIsInitialized(this)) {
			const instance = BaseManager.getInstance_internal(this) as T;
			if (instance) {
				await cb(instance);
			}
		}
	}

	/** Register a callback to run on destroy */
	public static async onDestroy<T extends BaseManager>(
		this: { new (...args: any[]): T } & ManagerConstructor,
		cb: Callback<T>
	): Promise<void> {
		const callbacks = BaseManager.getOnDestroyCallbacks(this);
		callbacks.push(cb);

		if (BaseManager.getIsDestroyed(this)) {
			const instance = BaseManager.getInstance_internal(this) as T;
			if (instance) {
				await cb(instance);
			}
		}
	}

	/** Initialize the manager once */
	public static async initialize(): Promise<void> {
		const ctor = this as ManagerConstructor;

		if (this.getIsInitialized(ctor)) return;

		this.setIsInitialized(ctor, true);
		this.setIsDestroyed(ctor, false);

		const instance = this.getInstance_internal(ctor);
		const callbacks = this.getAfterInitCallbacks(ctor);

		if (instance) {
			// 1. Najpierw metoda instancji
			await instance.onInitialize();

			// 2. Potem callbacki statyczne
			for (const cb of callbacks) {
				await cb(instance);
			}
		}
	}

	/** Destroy the manager once */
	public static async destroy(): Promise<void> {
		const ctor = this as ManagerConstructor;

		if (this.getIsDestroyed(ctor)) return;

		this.setIsDestroyed(ctor, true);
		this.setIsInitialized(ctor, false);

		const instance = this.getInstance_internal(ctor);
		const callbacks = this.getOnDestroyCallbacks(ctor);

		if (instance) {
			// 1. Najpierw metoda instancji
			await instance.onDestroy();

			// 2. Potem callbacki statyczne
			for (const cb of callbacks) {
				await cb(instance);
			}
		}

		this.setInstance(ctor, undefined);
	}

	/** Fully type-safe singleton */
	public static getInstance<Args extends unknown[], T extends BaseManager>(
		this: { new (...args: Args): T } & ManagerConstructor,
		...args: Args
	): T {
		const existingInstance = BaseManager.getInstance_internal(this);

		if (!existingInstance) {
			const newInstance = new this(...args);
			BaseManager.setInstance(this, newInstance);
			(this as unknown as typeof BaseManager).initialize();
			return newInstance;
		}

		return existingInstance as T;
	}
}
