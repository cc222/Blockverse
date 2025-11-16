import type { GameServer } from '../GameServer';
import type { RpcTransport } from './RpcTransport';

// Lepszy sposób na wyciągnięcie kluczy funkcji
type FunctionKeys<T> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

// Upewnij się, że wyciągamy tylko metody
type GameServerMethods = Pick<GameServer, FunctionKeys<GameServer>>;

// Proxy z reliable/unreliable
export type GameServerProxy = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in keyof GameServerMethods]: GameServerMethods[K] extends (...args: infer P) => any
		? {
				reliable: (...args: P) => void;
				unreliable: (...args: P) => void;
			}
		: never;
};

export class Transport {
	static createGameProxy(transport: RpcTransport, localGame: GameServer): GameServerProxy {
		const proxy = new Proxy({} as GameServerProxy, {
			get(_, prop: string | symbol) {
				if (typeof prop !== 'string') return undefined;

				return {
					reliable: (...args: unknown[]) => transport.callReliable(prop, args),
					unreliable: (...args: unknown[]) => transport.callUnreliable(prop, args)
				};
			}
		});

		// Obsługa przychodzących wywołań
		transport.onReceive = (method, args) => {
			const fn = localGame[method as keyof GameServer];
			if (typeof fn === 'function') {
				(fn as (...args: unknown[]) => void).apply(localGame, args);
			}
		};

		return proxy;
	}
}
