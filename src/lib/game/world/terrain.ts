// src/game/terrain.ts
import { BlockId } from './blocks';
import { Perlin } from './perlin';
import { BIOMES, type Biom } from './biomes';
import { WorldSettings } from '../settings/world';

interface BiomeInfluence {
	biome: Biom;
	weight: number;
}

export interface TerrainConfig {
	width: number;
	depth: number;
	height: number;
	scale?: number;
	seed?: number;
	waterLevel?: number;
	caveThreshold?: number;
	// Nowe opcje konfiguracji
	biomeSize?: number; // Jak duże są biomy (domyślnie 1000)
	biomeBlendDistance?: number; // Jak szeroki jest blend między biomami (domyślnie 4.0)
	terrainSmoothness?: number; // Jak gładki jest teren (domyślnie 0.6)
	heightBlendPower?: number; // Jak mocno blendować wysokości (domyślnie 2.0)
	continentalScale?: number; // Skala kontynentów (domyślnie 1200)
	erosionStrength?: number; // Siła erozji (domyślnie 0.3)
	mountainThreshold?: number; // Próg dla gór (domyślnie 0.65)
	landMassAmount?: number; // Ile lądu (0-1, domyślnie 0.6 = 60% lądu)
}

export class TerrainGenerator {
	width: number;
	depth: number;
	height: number;
	seed: number;
	scale: number;
	waterLevel: number;
	caveThreshold: number;
	perlin: Perlin;
	temperatureNoise: Perlin;
	humidityNoise: Perlin;
	continentalnessNoise: Perlin;
	erosionNoise: Perlin;

	// Nowe parametry konfiguracji
	biomeSize: number;
	biomeBlendDistance: number;
	terrainSmoothness: number;
	heightBlendPower: number;
	continentalScale: number;
	erosionStrength: number;
	mountainThreshold: number;
	landMassAmount: number;

	constructor(config: TerrainConfig) {
		this.width = config.width;
		this.depth = config.depth;
		this.height = config.height;
		this.scale = config.scale ?? WorldSettings.TERRAIN_SCALE;
		this.seed = config.seed ?? 0;
		this.waterLevel = config.waterLevel ?? Math.floor(config.height * 0.3);
		this.caveThreshold = config.caveThreshold ?? WorldSettings.TERRAIN_CAVETHRESHOLD;

		// Nowe parametry z domyślnymi wartościami
		this.biomeSize = config.biomeSize ?? 1000;
		this.biomeBlendDistance = config.biomeBlendDistance ?? 5.0;
		this.terrainSmoothness = config.terrainSmoothness ?? 0.6;
		this.heightBlendPower = config.heightBlendPower ?? 2.5;
		this.continentalScale = config.continentalScale ?? 1200;
		this.erosionStrength = config.erosionStrength ?? 0.25;
		this.mountainThreshold = config.mountainThreshold ?? 0.7;
		this.landMassAmount = config.landMassAmount ?? 0.6; // 60% lądu domyślnie

		// Multiple noise layers for better terrain variety
		this.perlin = new Perlin(this.seed);
		this.temperatureNoise = new Perlin(this.seed + 1000);
		this.humidityNoise = new Perlin(this.seed + 2000);
		this.continentalnessNoise = new Perlin(this.seed + 3000);
		this.erosionNoise = new Perlin(this.seed + 4000);
	}

	/** --- Multi-octave noise sampling --- */
	private sampleNoise(
		perlin: Perlin,
		x: number,
		z: number,
		scale: number,
		octaves: number = 4
	): number {
		let n = 0,
			amp = 1,
			freq = 1,
			max = 0;

		for (let o = 0; o < octaves; o++) {
			n += perlin.noise((x / scale) * freq, (z / scale) * freq) * amp;
			max += amp;
			amp *= 0.5;
			freq *= 2;
		}

		return n / max;
	}

	/** --- Smooth interpolation function --- */
	private smoothstep(edge0: number, edge1: number, x: number): number {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	}

	/** --- Calculate distance between biome and climate point --- */
	private biomeDistance(biome: Biom, temp: number, humid: number): number {
		const dt = temp - biome.temperature;
		const dh = humid - biome.humidity;
		return Math.sqrt(dt * dt + dh * dh);
	}

	/** --- Get multiple nearby biomes with weights for smooth blending --- */
	private getBiomeInfluences(x: number, z: number): BiomeInfluence[] {
		// Large scale continent formation
		const continentalness = this.sampleNoise(
			this.continentalnessNoise,
			x,
			z,
			this.continentalScale,
			3
		);

		// Climate zones with very smooth noise
		const temp = this.sampleNoise(this.temperatureNoise, x, z, this.biomeSize, 5) * 2 - 1;
		const humid = this.sampleNoise(this.humidityNoise, x, z, this.biomeSize * 0.9, 5) * 2 - 1;

		// Adjust temperature by altitude (less aggressive)
		const adjustedTemp = temp - continentalness * 0.15;

		// Calculate distance to each biome
		const influences: BiomeInfluence[] = BIOMES.map((biome) => {
			const dist = this.biomeDistance(biome, adjustedTemp, humid);
			// Convert distance to weight with configurable falloff
			const weight = Math.exp(-dist * this.biomeBlendDistance);
			return { biome, weight };
		});

		// Normalize weights
		const totalWeight = influences.reduce((sum, inf) => sum + inf.weight, 0);
		influences.forEach((inf) => (inf.weight /= totalWeight));

		// Sort by weight and keep top 4 for better blending
		return influences
			.sort((a, b) => b.weight - a.weight)
			.slice(0, 4)
			.filter((inf) => inf.weight > 0.03); // Lower threshold for smoother transitions
	}

	/** --- Biome at position (returns dominant biome) --- */
	biomeAt(x: number, z: number): Biom {
		const influences = this.getBiomeInfluences(x, z);
		return influences[0].biome;
	}

	/** --- Enhanced heightmap with smooth biome blending --- */
	private heightAt(x: number, z: number): number {
		const influences = this.getBiomeInfluences(x, z);

		// Continental scale terrain - adjusted to create more land
		const continentalness = this.sampleNoise(
			this.continentalnessNoise,
			x,
			z,
			this.continentalScale,
			3
		);
		// Shift continentalness based on landMassAmount (0.6 = 60% land)
		const adjustedContinental = continentalness * (1 - this.landMassAmount) + this.landMassAmount;

		// Main terrain noise - więcej oktaw dla płynności
		const terrainNoise = this.sampleNoise(this.perlin, x, z, this.scale, 6);

		// Erosion creates valleys and ridges
		const erosion = this.sampleNoise(this.erosionNoise, x, z, 200, 3);

		// Blend heights from all influential biomes using power function for smoother transitions
		let blendedHeight = 0;
		let totalWeight = 0;

		for (const inf of influences) {
			// Użyj power function do wygładzenia wag
			const smoothWeight = Math.pow(inf.weight, this.heightBlendPower);
			const biomeHeight = inf.biome.baseHeight + terrainNoise * inf.biome.heightVariation;
			blendedHeight += biomeHeight * smoothWeight;
			totalWeight += smoothWeight;
		}

		blendedHeight /= totalWeight;

		// Apply smoothness factor
		blendedHeight =
			blendedHeight * this.terrainSmoothness + terrainNoise * (1 - this.terrainSmoothness) * 0.15;

		// Gentle erosion application
		blendedHeight = blendedHeight * (0.85 + erosion * this.erosionStrength);

		// Apply adjusted continentalness to push land higher
		blendedHeight = blendedHeight * (0.5 + adjustedContinental * 0.5);

		const finalHeight = blendedHeight * this.height;

		// Remove the max() constraint that was forcing minimum height
		return Math.floor(finalHeight);
	}

	/** --- Improved cave system with multiple scales --- */
	private caveAt(x: number, y: number, z: number): number {
		// Large cave systems
		const largeCaves = this.sampleNoise(this.perlin, x, z, this.scale / 1.5, 3);
		const largeCaveNoise = this.perlin.noise(
			x / (this.scale / 1.5),
			y / (this.scale / 1.5),
			z / (this.scale / 1.5)
		);

		// Small tunnels
		let smallCaves = 0,
			amp = 1,
			freq = WorldSettings.TERRAIN_CAVEFREQ,
			max = 0;
		for (let o = 0; o < 3; o++) {
			smallCaves +=
				this.perlin.noise(
					(x / (this.scale / 2)) * freq,
					(y / (this.scale / 2)) * freq,
					(z / (this.scale / 2)) * freq
				) * amp;
			max += amp;
			amp *= 0.5;
			freq *= 2;
		}
		smallCaves = smallCaves / max;

		// Combine cave systems
		const caveDensity = largeCaves * 0.3 + 0.7;
		return Math.max(largeCaveNoise * caveDensity, smallCaves);
	}

	/** --- Determine if this is a steep mountain area --- */
	private isSteepTerrain(x: number, z: number, h: number): boolean {
		// Sample nearby heights to detect steepness
		const h1 = this.heightAt(x + 1, z);
		const h2 = this.heightAt(x - 1, z);
		const h3 = this.heightAt(x, z + 1);
		const h4 = this.heightAt(x, z - 1);

		const maxDiff = Math.max(
			Math.abs(h - h1),
			Math.abs(h - h2),
			Math.abs(h - h3),
			Math.abs(h - h4)
		);

		// If height difference is significant, it's steep
		return maxDiff > 3;
	}

	/** --- Blend surface blocks with gradient --- */
	private getBlendedSurfaceBlock(x: number, z: number, y: number, h: number): number {
		const influences = this.getBiomeInfluences(x, z);

		// Check if terrain is steep - use stone on steep slopes
		if (this.isSteepTerrain(x, z, h) && h > this.waterLevel + 5) {
			const continentalness = this.sampleNoise(
				this.continentalnessNoise,
				x,
				z,
				this.continentalScale,
				3
			);
			// Only use stone if also high elevation
			if (continentalness > this.mountainThreshold) {
				return BlockId.Stone;
			}
		}

		// Use weighted blending with smooth gradient
		if (influences.length === 1 || influences[0].weight > 0.8) {
			return influences[0].biome.surfaceBlock;
		}

		// Create smooth gradient using perlin noise
		const blendNoise = this.perlin.noise(x * 0.15, z * 0.15);
		let accumulated = 0;

		for (const inf of influences) {
			// Square the weight for smoother transitions
			accumulated += inf.weight * inf.weight;
			if (blendNoise < accumulated) {
				return inf.biome.surfaceBlock;
			}
		}

		return influences[0].biome.surfaceBlock;
	}

	/** --- Blend under blocks with gradient --- */
	private getBlendedUnderBlock(x: number, z: number, y: number, h: number): number {
		const influences = this.getBiomeInfluences(x, z);

		if (influences.length === 1 || influences[0].weight > 0.8) {
			return influences[0].biome.underBlock;
		}

		const blendNoise = this.perlin.noise(x * 0.15 + 100, z * 0.15 + 100);
		let accumulated = 0;

		for (const inf of influences) {
			accumulated += inf.weight * inf.weight;
			if (blendNoise < accumulated) {
				return inf.biome.underBlock;
			}
		}

		return influences[0].biome.underBlock;
	}

	/** --- Check if position should have ore --- */
	private getOre(x: number, y: number, z: number, baseBlock: number): number {
		if (baseBlock !== BlockId.Stone) return baseBlock;

		const depth = this.height - y;
		const oreNoise = this.perlin.noise(x * 0.1, y * 0.1, z * 0.1);

		if (oreNoise > 0.85) return baseBlock;
		if (depth > this.height * 0.3 && depth < this.height * 0.7 && oreNoise > 0.88) {
			return baseBlock;
		}
		if (depth > this.height * 0.6 && oreNoise > 0.92) {
			return baseBlock;
		}

		return baseBlock;
	}

	/** --- Get block id at given world position --- */
	sample(x: number, y: number, z: number): number {
		const h = this.heightAt(x, z);
		const caveNoise = this.caveAt(x, y, z);

		// Cave carving
		if (y < h - 5 && y > this.waterLevel + 2 && caveNoise > this.caveThreshold) {
			return BlockId.Air;
		}

		if (y <= h) {
			// Surface layer with blended blocks
			if (y === h) {
				// Beach sand near water
				if (h <= this.waterLevel + 3) {
					const biom = this.biomeAt(x, z);
					if (biom.name !== 'desert' && biom.name !== 'mountains') {
						return BlockId.Sand;
					}
				}
				return this.getBlendedSurfaceBlock(x, z, y, h);
			}
			// Sub-surface layers with blending
			else if (y > h - 4) {
				return this.getBlendedUnderBlock(x, z, y, h);
			}
			// Deep stone with ores
			else {
				return this.getOre(x, y, z, BlockId.Stone);
			}
		}
		// Water level
		else if (y <= this.waterLevel) {
			return BlockId.Water;
		}

		return BlockId.Air;
	}

	/** --- Check if tree should generate at this position --- */
	shouldGenerateTree(x: number, z: number): boolean {
		const influences = this.getBiomeInfluences(x, z);

		// Blend tree chances from multiple biomes
		const blendedTreeChance = influences.reduce((sum, inf) => {
			return sum + (inf.biome.treeChance || 0) * inf.weight;
		}, 0);

		if (blendedTreeChance === 0) return false;

		const treeNoise = this.perlin.noise(x * 0.05, z * 0.05);
		return treeNoise > 1 - blendedTreeChance;
	}

	/** --- Check if grass/vegetation should generate --- */
	shouldGenerateGrass(x: number, z: number): boolean {
		const influences = this.getBiomeInfluences(x, z);

		// Blend grass chances from multiple biomes
		const blendedGrassChance = influences.reduce((sum, inf) => {
			return sum + (inf.biome.grassChance || 0) * inf.weight;
		}, 0);

		if (blendedGrassChance === 0) return false;

		const grassNoise = this.perlin.noise(x * 0.2, z * 0.2);
		return grassNoise > 1 - blendedGrassChance;
	}
}
