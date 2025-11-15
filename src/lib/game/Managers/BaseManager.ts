type Callback = () => void | Promise<void>;

// Symbol keys for storing per-class data directly on constructor
const AFTER_INIT_CALLBACKS = Symbol('afterInitCallbacks');
const ON_DESTROY_CALLBACKS = Symbol('onDestroyCallbacks');
const IS_INITIALIZED = Symbol('isInitialized');
const IS_DESTROYED = Symbol('isDestroyed');
const INSTANCE = Symbol('instance');

interface ManagerConstructor {
	[AFTER_INIT_CALLBACKS]?: Callback[];
	[ON_DESTROY_CALLBACKS]?: Callback[];
	[IS_INITIALIZED]?: boolean;
	[IS_DESTROYED]?: boolean;
	[INSTANCE]?: BaseManager;
}

export abstract class BaseManager {
	protected constructor() {}

	/** Get or initialize afterInit callbacks array for this specific class */
	private static getAfterInitCallbacks(ctor: ManagerConstructor): Callback[] {
		if (!ctor[AFTER_INIT_CALLBACKS]) {
			ctor[AFTER_INIT_CALLBACKS] = [];
		}
		return ctor[AFTER_INIT_CALLBACKS];
	}

	/** Get or initialize onDestroy callbacks array for this specific class */
	private static getOnDestroyCallbacks(ctor: ManagerConstructor): Callback[] {
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

	/** Set instance for this specific class */
	private static setInstance(ctor: ManagerConstructor, instance: BaseManager | undefined): void {
		ctor[INSTANCE] = instance;
	}

	/** Register a callback to run after initialization */
	public static async afterInitialization(cb: Callback): Promise<void> {
		const callbacks = this.getAfterInitCallbacks(this as ManagerConstructor);
		callbacks.push(cb);

		if (this.getIsInitialized(this as ManagerConstructor)) {
			await cb();
		}
	}

	/** Register a callback to run on destroy */
	public static async onDestroy(cb: Callback): Promise<void> {
		const callbacks = this.getOnDestroyCallbacks(this as ManagerConstructor);
		callbacks.push(cb);

		if (this.getIsDestroyed(this as ManagerConstructor)) {
			await cb();
		}
	}

	/** Initialize the manager once */
	public static async initialize(): Promise<void> {
		const ctor = this as ManagerConstructor;

		if (this.getIsInitialized(ctor)) return;

		this.setIsInitialized(ctor, true);
		this.setIsDestroyed(ctor, false);

		const callbacks = this.getAfterInitCallbacks(ctor);
		for (const cb of callbacks) {
			await cb();
		}
	}

	/** Destroy the manager once */
	public static async destroy(): Promise<void> {
		const ctor = this as ManagerConstructor;

		if (this.getIsDestroyed(ctor)) return;

		this.setIsDestroyed(ctor, true);
		this.setIsInitialized(ctor, false);

		const callbacks = this.getOnDestroyCallbacks(ctor);
		for (const cb of callbacks) {
			await cb();
		}

		this.setInstance(ctor, undefined);
	}

	/** Fully type-safe singleton */
	public static async getInstance<Args extends unknown[], T extends BaseManager>(
		this: { new (...args: Args): T } & ManagerConstructor,
		...args: Args
	): Promise<T> {
		const existingInstance = BaseManager.getInstance_internal(this);

		if (!existingInstance) {
			const newInstance = new this(...args);
			BaseManager.setInstance(this, newInstance);
			await (this as unknown as typeof BaseManager).initialize();
			return newInstance;
		}

		return existingInstance as T;
	}
}
