// src/game/biomes.ts
// src/game/biomes.ts
import type { BlockType } from './blocks';

export interface Biom {
	name: string;
	baseHeight: number;
	heightVariation: number;
	surfaceBlock: BlockType;
	underBlock: BlockType;
	stoneBlock: BlockType;
	temperature: number;
	humidity: number;
	color: number;
}

export const BIOMES: Biom[] = [
	{
		name: 'plains',
		baseHeight: 0.45,
		heightVariation: 0.2,
		surfaceBlock: 'grass',
		underBlock: 'dirt',
		stoneBlock: 'stone',
		temperature: 0.5,
		humidity: 0.6,
		color: 0x4caf50
	},
	{
		name: 'desert',
		baseHeight: 0.35,
		heightVariation: 0.05,
		surfaceBlock: 'sand',
		underBlock: 'sand',
		stoneBlock: 'stone',
		temperature: 0.9,
		humidity: 0.1,
		color: 0xffe066
	},
	{
		name: 'mountains',
		baseHeight: 0.6,
		heightVariation: 0.4,
		surfaceBlock: 'stone',
		underBlock: 'stone',
		stoneBlock: 'stone',
		temperature: 0.3,
		humidity: 0.5,
		color: 0xaaaaaa
	},
	{
		name: 'snow',
		baseHeight: 0.55,
		heightVariation: 0.2,
		surfaceBlock: 'grass', // docelowo snow block
		underBlock: 'dirt',
		stoneBlock: 'stone',
		temperature: -0.3,
		humidity: 0.4,
		color: 0xffffff
	}
];
