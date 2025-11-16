export interface RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;
	callReliable(method: string, args: unknown[]): void;
	callUnreliable(method: string, args: unknown[]): void;
}
