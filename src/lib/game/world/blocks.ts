// src/game/blocks.ts
export type BlockType = 'air' | 'grass' | 'dirt' | 'stone' | 'sand' | 'water';

export class Block {
	type: BlockType;
	transparent: boolean;
	color: number;

	constructor(type: BlockType) {
		this.type = type;
		this.transparent = ['air', 'water'].includes(type);
		this.color = Block.colors[type];
	}

	static colors: Record<BlockType, number> = {
		air: 0x000000,
		grass: 0x4caf50,
		dirt: 0x8b5a2b,
		stone: 0x888888,
		sand: 0xf4e7a1,
		water: 0x3ea6ff
	};

	static ids: Record<BlockType, number> = {
		air: 0,
		grass: 1,
		dirt: 2,
		stone: 3,
		sand: 4,
		water: 5
	};

	static fromId(id: number): Block {
		const type = (Object.keys(this.ids) as BlockType[]).find((key) => this.ids[key] === id)!;
		return new Block(type);
	}

	static toId(type: BlockType): number {
		return this.ids[type];
	}
}
