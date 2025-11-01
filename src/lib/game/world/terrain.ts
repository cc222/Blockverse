// src/game/terrain.ts
import { Block } from './blocks';
import { Perlin } from './perlin';

export class TerrainGenerator {
	width: number;
	depth: number;
	height: number;
	seed: number;
	scale: number;
	waterLevel: number;
	caveThreshold: number;
	voxels: Uint8Array;
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
		this.voxels = new Uint8Array(width * height * depth);
	}

	index(x: number, y: number, z: number): number {
		return x + y * this.width + z * this.width * this.height;
	}

	private heightAt(x: number, z: number): number {
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
		return Math.floor((n / max) * this.height);
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

	generate(): Uint8Array {
		const { width, depth, height, waterLevel, caveThreshold } = this;

		for (let x = 0; x < width; x++) {
			for (let z = 0; z < depth; z++) {
				const h = this.heightAt(x, z);
				for (let y = 0; y < height; y++) {
					let id = Block.toId('air');
					const caveNoise = this.caveAt(x, y, z);
					if (caveNoise > caveThreshold) {
						id = Block.toId('air');
					} else if (y <= h) {
						if (y === h) {
							id = y <= waterLevel ? Block.toId('sand') : Block.toId('grass');
						} else if (y > h - 3) {
							id = Block.toId('dirt');
						} else {
							id = Block.toId('stone');
						}
					} else if (y <= waterLevel) {
						id = Block.toId('water');
					}

					this.voxels[this.index(x, y, z)] = id;
				}
			}
		}

		return this.voxels;
	}
}
