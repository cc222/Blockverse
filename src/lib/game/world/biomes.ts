import { BlockId } from './blocks';

export interface Biom {
	name: string;
	baseHeight: number;
	heightVariation: number;
	surfaceBlock: BlockId;
	underBlock: BlockId;
	stoneBlock: BlockId;
	temperature: number;
	humidity: number;
	color: number;
	treeChance?: number; // Probability of tree generation
	grassChance?: number; // Probability of grass/vegetation
}

export const BIOMES: Biom[] = [
	{
		name: 'plains',
		baseHeight: 0.45,
		heightVariation: 0.15,
		surfaceBlock: BlockId.Grass,
		underBlock: BlockId.Dirt,
		stoneBlock: BlockId.Stone,
		temperature: 0.5,
		humidity: 0.6,
		color: 0x4caf50,
		treeChance: 0.02,
		grassChance: 0.4
	},
	{
		name: 'forest',
		baseHeight: 0.48,
		heightVariation: 0.18,
		surfaceBlock: BlockId.Grass,
		underBlock: BlockId.Dirt,
		stoneBlock: BlockId.Stone,
		temperature: 0.4,
		humidity: 0.8,
		color: 0x2d5016,
		treeChance: 0.12,
		grassChance: 0.6
	},
	{
		name: 'desert',
		baseHeight: 0.4,
		heightVariation: 0.08,
		surfaceBlock: BlockId.Sand,
		underBlock: BlockId.Sand,
		stoneBlock: BlockId.Stone,
		temperature: 0.9,
		humidity: 0.1,
		color: 0xffe066,
		treeChance: 0.001,
		grassChance: 0.02
	},
	{
		name: 'mountains',
		baseHeight: 0.65,
		heightVariation: 0.35,
		surfaceBlock: BlockId.Stone,
		underBlock: BlockId.Stone,
		stoneBlock: BlockId.Stone,
		temperature: 0.2,
		humidity: 0.5,
		color: 0x888888,
		treeChance: 0.005,
		grassChance: 0.1
	},
	{
		name: 'snow',
		baseHeight: 0.58,
		heightVariation: 0.22,
		surfaceBlock: BlockId.Grass, // Snow block when available
		underBlock: BlockId.Dirt,
		stoneBlock: BlockId.Stone,
		temperature: -0.4,
		humidity: 0.4,
		color: 0xffffff,
		treeChance: 0.008,
		grassChance: 0.05
	},
	{
		name: 'tundra',
		baseHeight: 0.42,
		heightVariation: 0.12,
		surfaceBlock: BlockId.Grass,
		underBlock: BlockId.Dirt,
		stoneBlock: BlockId.Stone,
		temperature: -0.2,
		humidity: 0.3,
		color: 0xc4d4cc,
		treeChance: 0.003,
		grassChance: 0.15
	},
	{
		name: 'savanna',
		baseHeight: 0.44,
		heightVariation: 0.1,
		surfaceBlock: BlockId.Grass,
		underBlock: BlockId.Dirt,
		stoneBlock: BlockId.Stone,
		temperature: 0.7,
		humidity: 0.3,
		color: 0xbdb25f,
		treeChance: 0.015,
		grassChance: 0.3
	},
	{
		name: 'swamp',
		baseHeight: 0.38,
		heightVariation: 0.08,
		surfaceBlock: BlockId.Grass,
		underBlock: BlockId.Dirt,
		stoneBlock: BlockId.Stone,
		temperature: 0.6,
		humidity: 0.9,
		color: 0x4a5f3a,
		treeChance: 0.06,
		grassChance: 0.5
	}
];
