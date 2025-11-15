import type { GameServer } from '../GameServer';
import type { RpcTransport } from './RpcTransport';

export class Transport {
	static createGameProxy(transport: RpcTransport) {
		const proxy = new Proxy(
			{},
			{
				get(_, prop: string) {
					return (...args: unknown[]) => transport.call(prop, args);
				}
			}
		);

		// obsługa przychodzących wywołań
		transport.onReceive = (method, args) => {
			// @ts-expect-error fix
			proxy[method](...args);
		};

		return proxy as GameServer;
	}
}
