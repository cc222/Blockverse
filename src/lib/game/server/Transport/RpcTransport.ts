export interface RpcTransport {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	call: (method: string, args: any[]) => void;
	onReceive?: (method: string, args: unknown[]) => void;
}
