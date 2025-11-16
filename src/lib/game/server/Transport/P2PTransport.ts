import type { RpcTransport } from './RpcTransport';

export class P2PTransport implements RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;

	constructor(
		private reliableChannel: RTCDataChannel,
		private unreliableChannel: RTCDataChannel
	) {
		// Nasłuchuj na obu kanałach
		this.reliableChannel.onmessage = (event) => {
			try {
				const { method, args } = JSON.parse(event.data);
				this.onReceive?.(method, args);
			} catch (e) {
				console.error('Invalid P2P reliable message', e);
			}
		};

		this.unreliableChannel.onmessage = (event) => {
			try {
				const { method, args } = JSON.parse(event.data);
				this.onReceive?.(method, args);
			} catch (e) {
				console.error('Invalid P2P unreliable message', e);
			}
		};
	}

	callReliable(method: string, args: unknown[]): void {
		this.reliableChannel.send(JSON.stringify({ method, args }));
	}

	callUnreliable(method: string, args: unknown[]): void {
		this.unreliableChannel.send(JSON.stringify({ method, args }));
	}
}
