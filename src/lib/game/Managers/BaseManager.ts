type Callback = () => void | Promise<void>;

export abstract class BaseManager {
	// Strongly typed singleton instance
	protected static instance?: BaseManager;

	private static _isInitialized = false;
	private static _isDestroyed = false;

	private static afterInitCallbacks: Callback[] = [];
	private static onDestroyCallbacks: Callback[] = [];

	protected constructor() {}

	/** Register a callback to run after initialization */
	public static async afterInitialization(cb: Callback) {
		this.afterInitCallbacks.push(cb);
		if (this._isInitialized) await cb();
	}

	/** Register a callback to run on destroy */
	public static async onDestroy(cb: Callback) {
		this.onDestroyCallbacks.push(cb);
		if (this._isDestroyed) await cb();
	}

	/** Initialize the manager once */
	public static async initialize() {
		if (this._isInitialized) return;
		this._isInitialized = true;
		this._isDestroyed = false;

		for (const cb of this.afterInitCallbacks) {
			await cb();
		}
	}

	/** Destroy the manager once */
	public static async destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;
		this._isInitialized = false;

		for (const cb of this.onDestroyCallbacks) {
			await cb();
		}
		this.instance = undefined;
	}

	/** Fully type-safe singleton */
	public static async getInstance<Args extends unknown[], T extends BaseManager>(
		this: { new (...args: Args): T; _instance?: T },
		...args: Args
	): Promise<T> {
		if (!this._instance) {
			this._instance = new this(...args);
			await (this as unknown as typeof BaseManager).initialize();
		}
		return this._instance;
	}
}
