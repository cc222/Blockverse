/* eslint-disable @typescript-eslint/no-explicit-any */
// Lightweight module declaration to work around package "exports"/typing resolution
// The real package ships types under `node_modules/threads/dist/index.d.ts` but
// some bundler/package.json "exports" maps make TypeScript unable to resolve them
// in some setups. This declaration provides permissive any-typed signatures so
// your code can import from 'threads' without TS7016 errors.

declare module 'threads' {
	// Minimal, permissive signatures used in this project. Replace with stricter
	// types if you want full type safety.
	export function spawn<T = any>(factoryOrWorker: any): Promise<T>;

	// Worker is constructible in code (used with `new Worker(path)`). Declare as
	// a class so it can be used both as a value (constructor) and a type.
	export class Worker {
		constructor(path: string);
	}

	// Pool is constructible and used as a type `Pool<T>` in the code. Provide the
	// minimal API used by this project: constructor, queue and terminate.
	export class Pool<T = any> {
		constructor(factory: () => Promise<T> | T, size?: number);
		queue<R = any>(job: (worker: T) => Promise<R> | R): Promise<R>;
		terminate(): Promise<void>;
	}

	export function expose(api: any): any;

	// Some code imports worker helpers from 'threads/worker' (e.g. `expose` there).
	// Provide a lightweight declaration for that subpath so TypeScript can resolve it
	// even when the package's "exports" mapping hides the shipped .d.ts.

	// Named exports fallback
	const _default: any;
	export default _default;
}
declare module 'threads/worker' {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	export function expose<T = any>(api: T): void;
}
