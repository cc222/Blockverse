// src/game/terrain.ts
import { BlockId } from './blocks';
import { Perlin } from './perlin';
import { BIOMES, type Biom } from './biomes';

export class TerrainGenerator {
	width: number;
	depth: number;
	height: number;
	seed: number;
	scale: number;
	waterLevel: number;
	caveThreshold: number;
	perlin: Perlin;

	constructor({
		width,
		depth,
		height,
		scale = 40,
		seed = 0,
		waterLevel = Math.floor(height * 0.3),
		caveThreshold = 0.55
	}: {
		width: number;
		depth: number;
		height: number;
		scale?: number;
		seed?: number;
		waterLevel?: number;
		caveThreshold?: number;
	}) {
		this.width = width;
		this.depth = depth;
		this.height = height;
		this.scale = scale;
		this.seed = seed;
		this.waterLevel = waterLevel;
		this.caveThreshold = caveThreshold;
		this.perlin = new Perlin(seed);
	}

	/** --- BIOM selection based on 2D Perlin noise --- */
	biomeAt(x: number, z: number): Biom {
		// 🔧 używamy szumu -1..1 zamiast 0..1
		const temp = this.perlin.noise(x / 400, z / 400) * 2 - 1;
		const humid = this.perlin.noise((x + 10000) / 400, (z + 10000) / 400) * 2 - 1;
		//const value = (temp + humid) / 2; // mieszanina

		// 👇 rozdzielamy biomy po kwadracie (temperatura/wilgotność)
		if (temp < -0.3) {
			if (humid < 0) return BIOMES.find((b) => b.name === 'snow')!;
			return BIOMES.find((b) => b.name === 'mountains')!;
		} else if (temp < 0.3) {
			if (humid < 0) return BIOMES.find((b) => b.name === 'plains')!;
			return BIOMES.find((b) => b.name === 'mountains')!;
		} else {
			if (humid < 0) return BIOMES.find((b) => b.name === 'desert')!;
			return BIOMES.find((b) => b.name === 'plains')!;
		}
	}

	/** --- Heightmap generation influenced by biome --- */
	private heightAt(x: number, z: number): number {
		const biom = this.biomeAt(x, z);
		let n = 0,
			amp = 1,
			freq = 1,
			max = 0;

		for (let o = 0; o < 4; o++) {
			n += this.perlin.noise((x / this.scale) * freq, (z / this.scale) * freq) * amp;
			max += amp;
			amp *= 0.5;
			freq *= 2;
		}

		const normalized = n / max;
		const height = (biom.baseHeight + normalized * biom.heightVariation) * this.height;

		return Math.floor(height);
	}

	private caveAt(x: number, y: number, z: number): number {
		let n = 0,
			amp = 1,
			freq = 1,
			max = 0;
		for (let o = 0; o < 3; o++) {
			n +=
				this.perlin.noise(
					(x / (this.scale / 2)) * freq,
					(y / (this.scale / 2)) * freq,
					(z / (this.scale / 2)) * freq
				) * amp;
			max += amp;
			amp *= 0.5;
			freq *= 2;
		}
		return n / max;
	}

	/** --- Get block id at given world position --- */
	sample(x: number, y: number, z: number): number {
		const biom = this.biomeAt(x, z);
		const h = this.heightAt(x, z);
		const caveNoise = this.caveAt(x, y, z);

		if (caveNoise > this.caveThreshold) return BlockId.Air;

		if (y <= h) {
			if (y === h) {
				return biom.surfaceBlock;
			} else if (y > h - 3) {
				return biom.underBlock;
			} else {
				return biom.stoneBlock;
			}
		} else if (y <= this.waterLevel) {
			return BlockId.Water;
		}

		return BlockId.Air;
	}
}
