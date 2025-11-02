export enum BlockId {
	Air = 0,
	Grass,
	Dirt,
	Stone,
	Sand,
	Water
}

export interface BlockDef {
	id: BlockId;
	color: number;
	transparent: boolean;
}

export class Block {
	static readonly defs: readonly BlockDef[] = [
		{ id: BlockId.Air, color: 0x000000, transparent: true },
		{ id: BlockId.Grass, color: 0x4caf50, transparent: false },
		{ id: BlockId.Dirt, color: 0x8b5a2b, transparent: false },
		{ id: BlockId.Stone, color: 0x888888, transparent: false },
		{ id: BlockId.Sand, color: 0xf4e7a1, transparent: false },
		{ id: BlockId.Water, color: 0x3ea6ff, transparent: true }
	] as const;

	static getColor(id: BlockId): number {
		return Block.defs[id].color;
	}

	static isTransparent(id: BlockId): boolean {
		return Block.defs[id].transparent;
	}

	static getDef(id: BlockId): BlockDef {
		return Block.defs[id];
	}
}
