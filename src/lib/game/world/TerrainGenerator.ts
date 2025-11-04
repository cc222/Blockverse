import { BlockId } from './blocks';

// Simplex Noise - implementacja dla proceduralnej generacji terenu
class SimplexNoise {
	private perm: number[];
	private grad3 = [
		[1, 1, 0],
		[-1, 1, 0],
		[1, -1, 0],
		[-1, -1, 0],
		[1, 0, 1],
		[-1, 0, 1],
		[1, 0, -1],
		[-1, 0, -1],
		[0, 1, 1],
		[0, -1, 1],
		[0, 1, -1],
		[0, -1, -1]
	];

	constructor(seed: number = Math.random()) {
		this.perm = [];
		const p = [];
		for (let i = 0; i < 256; i++) {
			p[i] = i;
		}

		let n, q;
		for (let i = 255; i > 0; i--) {
			seed = (seed * 9301 + 49297) % 233280;
			n = seed / 233280;
			q = Math.floor(i * n);
			const tmp = p[i];
			p[i] = p[q];
			p[q] = tmp;
		}

		for (let i = 0; i < 512; i++) {
			this.perm[i] = p[i & 255];
		}
	}

	private dot(g: number[], x: number, y: number, z: number): number {
		return g[0] * x + g[1] * y + g[2] * z;
	}

	noise(x: number, y: number, z: number): number {
		const F3 = 1.0 / 3.0;
		const G3 = 1.0 / 6.0;

		let n0, n1, n2, n3;
		const s = (x + y + z) * F3;
		const i = Math.floor(x + s);
		const j = Math.floor(y + s);
		const k = Math.floor(z + s);

		const t = (i + j + k) * G3;
		const X0 = i - t;
		const Y0 = j - t;
		const Z0 = k - t;
		const x0 = x - X0;
		const y0 = y - Y0;
		const z0 = z - Z0;

		let i1, j1, k1, i2, j2, k2;
		if (x0 >= y0) {
			if (y0 >= z0) {
				i1 = 1;
				j1 = 0;
				k1 = 0;
				i2 = 1;
				j2 = 1;
				k2 = 0;
			} else if (x0 >= z0) {
				i1 = 1;
				j1 = 0;
				k1 = 0;
				i2 = 1;
				j2 = 0;
				k2 = 1;
			} else {
				i1 = 0;
				j1 = 0;
				k1 = 1;
				i2 = 1;
				j2 = 0;
				k2 = 1;
			}
		} else {
			if (y0 < z0) {
				i1 = 0;
				j1 = 0;
				k1 = 1;
				i2 = 0;
				j2 = 1;
				k2 = 1;
			} else if (x0 < z0) {
				i1 = 0;
				j1 = 1;
				k1 = 0;
				i2 = 0;
				j2 = 1;
				k2 = 1;
			} else {
				i1 = 0;
				j1 = 1;
				k1 = 0;
				i2 = 1;
				j2 = 1;
				k2 = 0;
			}
		}

		const x1 = x0 - i1 + G3;
		const y1 = y0 - j1 + G3;
		const z1 = z0 - k1 + G3;
		const x2 = x0 - i2 + 2.0 * G3;
		const y2 = y0 - j2 + 2.0 * G3;
		const z2 = z0 - k2 + 2.0 * G3;
		const x3 = x0 - 1.0 + 3.0 * G3;
		const y3 = y0 - 1.0 + 3.0 * G3;
		const z3 = z0 - 1.0 + 3.0 * G3;

		const ii = i & 255;
		const jj = j & 255;
		const kk = k & 255;
		const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
		const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
		const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
		const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;

		let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
		if (t0 < 0) n0 = 0.0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
		}

		let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
		if (t1 < 0) n1 = 0.0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
		}

		let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
		if (t2 < 0) n2 = 0.0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
		}

		let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
		if (t3 < 0) n3 = 0.0;
		else {
			t3 *= t3;
			n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
		}

		return 32.0 * (n0 + n1 + n2 + n3);
	}
}

// Typy biomów
export enum BiomeType {
	Ocean = 0,
	Beach,
	Plains,
	Forest,
	Desert,
	Mountains,
	SnowyPeaks,
	Mesa,
	Savanna,
	Swamp
}

export interface BiomeData {
	type: BiomeType;
	temperature: number;
	humidity: number;
	elevation: number;
}

// Typy struktur geologicznych
interface GeologicalFeature {
	hasCave: boolean;
	hasOreVein: boolean;
	oreType?: BlockId;
	hasCliff: boolean;
}

export interface GeneratorConfig {
	seed?: number;

	continentScale?: number;
	terrainScale?: number;
	mountainScale?: number;

	baseHeight?: number;
	maxHeight?: number;

	temperatureScale?: number;
	humidityScale?: number;

	waterLevel?: number;

	// Jaskinie - rzadsze
	caveScale?: number;
	caveThreshold?: number;
	minCaveHeight?: number;
	maxCaveHeight?: number;

	// Rudy minerałów
	oreScale?: number;
	oreRarity?: number;

	// Klify i urwiska
	cliffThreshold?: number;

	enableCaves?: boolean;
	enableOres?: boolean;
	enableRivers?: boolean;
}

export class TerrainGenerator {
	private continentNoise: SimplexNoise;
	private terrainNoise: SimplexNoise;
	private mountainNoise: SimplexNoise;
	private temperatureNoise: SimplexNoise;
	private humidityNoise: SimplexNoise;
	private caveNoise1: SimplexNoise;
	private caveNoise2: SimplexNoise;
	private riverNoise: SimplexNoise;
	private detailNoise: SimplexNoise;
	private oreNoise: SimplexNoise;
	private cliffNoise: SimplexNoise;
	private mesaNoise: SimplexNoise;

	private config: Required<GeneratorConfig>;

	constructor(config: GeneratorConfig = {}) {
		const seed = config.seed ?? Math.random() * 10000;

		this.continentNoise = new SimplexNoise(seed);
		this.terrainNoise = new SimplexNoise(seed * 1.1);
		this.mountainNoise = new SimplexNoise(seed * 1.2);
		this.temperatureNoise = new SimplexNoise(seed * 1.3);
		this.humidityNoise = new SimplexNoise(seed * 1.4);
		this.caveNoise1 = new SimplexNoise(seed * 1.5);
		this.caveNoise2 = new SimplexNoise(seed * 1.6);
		this.riverNoise = new SimplexNoise(seed * 1.7);
		this.detailNoise = new SimplexNoise(seed * 1.8);
		this.oreNoise = new SimplexNoise(seed * 1.9);
		this.cliffNoise = new SimplexNoise(seed * 2.0);
		this.mesaNoise = new SimplexNoise(seed * 2.1);

		this.config = {
			seed,
			continentScale: 0.0008,
			terrainScale: 0.004,
			mountainScale: 0.002,
			baseHeight: 64,
			maxHeight: 140,
			temperatureScale: 0.001,
			humidityScale: 0.0012,
			waterLevel: 62,
			caveScale: 0.005,
			caveThreshold: 0.05, // Wyższy = mniej jaskiń
			minCaveHeight: 15,
			maxCaveHeight: 70,
			oreScale: 0.08,
			oreRarity: 0.7, // Wyższy = rzadsze rudy
			cliffThreshold: 0.4,
			enableCaves: true,
			enableOres: true,
			enableRivers: true
		};

		Object.assign(this.config, config);
	}

	private octaveNoise(
		noise: SimplexNoise,
		x: number,
		z: number,
		octaves: number,
		persistence: number,
		scale: number
	): number {
		let total = 0;
		let frequency = 1;
		let amplitude = 1;
		let maxValue = 0;

		for (let i = 0; i < octaves; i++) {
			total += noise.noise(x * scale * frequency, 0, z * scale * frequency) * amplitude;
			maxValue += amplitude;
			amplitude *= persistence;
			frequency *= 2;
		}

		return total / maxValue;
	}

	private getTemperature(x: number, z: number): number {
		return this.octaveNoise(this.temperatureNoise, x, z, 3, 0.5, this.config.temperatureScale);
	}

	private getHumidity(x: number, z: number): number {
		return this.octaveNoise(this.humidityNoise, x, z, 3, 0.5, this.config.humidityScale);
	}

	private getContinentValue(x: number, z: number): number {
		return this.octaveNoise(this.continentNoise, x, z, 4, 0.5, this.config.continentScale);
	}

	private getTerrainHeight(x: number, z: number, biome: BiomeData): number {
		const continent = this.getContinentValue(x, z);
		let height = this.config.baseHeight + continent * 30;

		const terrain = this.octaveNoise(this.terrainNoise, x, z, 5, 0.5, this.config.terrainScale);
		height += terrain * 15;

		// Góry
		if (biome.type === BiomeType.Mountains || biome.type === BiomeType.SnowyPeaks) {
			const mountain = this.octaveNoise(
				this.mountainNoise,
				x,
				z,
				6,
				0.6,
				this.config.mountainScale
			);
			height += Math.max(0, mountain) * (biome.type === BiomeType.SnowyPeaks ? 65 : 50);
		}

		// Mesa - warstwowy teren
		if (biome.type === BiomeType.Mesa) {
			const mesa = this.mesaNoise.noise(x * 0.003, 0, z * 0.003);
			height += Math.abs(mesa) * 25;
			// Efekt warstwowy
			height = Math.floor(height / 3) * 3;
		}

		// Klify - gwałtowne zmiany wysokości
		const cliff = this.cliffNoise.noise(x * 0.008, 0, z * 0.008);
		if (Math.abs(cliff) > this.config.cliffThreshold) {
			height += (Math.abs(cliff) - this.config.cliffThreshold) * 40;
		}

		// Rzeki
		if (this.config.enableRivers) {
			const river = Math.abs(this.riverNoise.noise(x * 0.002, 0, z * 0.002));
			if (river < 0.05 && height > this.config.waterLevel + 5) {
				const riverDepth = (0.05 - river) / 0.05;
				height -= riverDepth * 10;
			}
		}

		const detail = this.detailNoise.noise(x * 0.1, 0, z * 0.1);
		height += detail * 2;

		return Math.floor(Math.max(40, Math.min(this.config.maxHeight, height)));
	}

	private getBiome(x: number, z: number): BiomeData {
		const temperature = this.getTemperature(x, z);
		const humidity = this.getHumidity(x, z);
		const continent = this.getContinentValue(x, z);

		const elevation = this.config.baseHeight + continent * 30;

		let type: BiomeType;

		// Ocean
		if (elevation < this.config.waterLevel - 10) {
			type = BiomeType.Ocean;
		}
		// Plaża
		else if (elevation < this.config.waterLevel + 3) {
			type = BiomeType.Beach;
		}
		// Śnieżne szczyty - bardzo wysokie i zimne
		else if (elevation > this.config.baseHeight + 35 && temperature < -0.4) {
			type = BiomeType.SnowyPeaks;
		}
		// Góry - wysokie tereny
		else if (elevation > this.config.baseHeight + 25) {
			type = BiomeType.Mountains;
		}
		// Mesa - gorąco, średnia wilgotność
		else if (temperature > 0.4 && humidity > -0.3 && humidity < 0.2) {
			type = BiomeType.Mesa;
		}
		// Pustynia - gorąco i sucho
		else if (temperature > 0.3 && humidity < -0.2) {
			type = BiomeType.Desert;
		}
		// Sawanna - gorąco, średnia wilgotność
		else if (temperature > 0.2 && humidity > -0.2 && humidity < 0.3) {
			type = BiomeType.Savanna;
		}
		// Bagno - mokro i ciepło
		else if (humidity > 0.5 && temperature > -0.1 && temperature < 0.4) {
			type = BiomeType.Swamp;
		}
		// Las - umiarkowana temperatura i wysoka wilgotność
		else if (humidity > 0.2 && temperature > -0.3 && temperature < 0.6) {
			type = BiomeType.Forest;
		}
		// Równiny - domyślnie
		else {
			type = BiomeType.Plains;
		}

		return { type, temperature, humidity, elevation };
	}

	private getGeologicalFeatures(x: number, y: number, z: number): GeologicalFeature {
		const features: GeologicalFeature = {
			hasCave: false,
			hasOreVein: false,
			hasCliff: false
		};

		// Jaskinie - rzadsze
		if (
			this.config.enableCaves &&
			y >= this.config.minCaveHeight &&
			y <= this.config.maxCaveHeight
		) {
			const cave1 = this.caveNoise1.noise(
				x * this.config.caveScale,
				y * this.config.caveScale,
				z * this.config.caveScale
			);

			const cave2 = this.caveNoise2.noise(
				x * this.config.caveScale * 1.3,
				y * this.config.caveScale * 1.3,
				z * this.config.caveScale * 1.3
			);

			// Tylko gdzie oba szumy się mocno pokrywają
			const caveValue = Math.abs(cave1) + Math.abs(cave2);
			features.hasCave = caveValue < this.config.caveThreshold;
		}

		// Żyły rudy - różne głębokości dla różnych rud
		if (this.config.enableOres && y < 80) {
			const oreValue = this.oreNoise.noise(
				x * this.config.oreScale,
				y * this.config.oreScale,
				z * this.config.oreScale
			);

			if (Math.abs(oreValue) > this.config.oreRarity) {
				features.hasOreVein = true;
				// Przykład: Stone jako ruda (możesz dodać więcej typów)
				features.oreType = BlockId.Stone;
			}
		}

		return features;
	}

	private getSurfaceBlock(biome: BiomeType, depth: number): BlockId {
		switch (biome) {
			case BiomeType.Desert:
			case BiomeType.Mesa:
				return depth < 5 ? BlockId.Sand : BlockId.Stone;

			case BiomeType.Beach:
				return depth < 3 ? BlockId.Sand : BlockId.Stone;

			case BiomeType.Savanna:
				if (depth === 0) return BlockId.Grass;
				if (depth < 2) return BlockId.Dirt;
				return BlockId.Stone;

			case BiomeType.Swamp:
				if (depth === 0) return BlockId.Grass;
				if (depth < 5) return BlockId.Dirt;
				return BlockId.Stone;

			case BiomeType.Forest:
			case BiomeType.Plains:
				if (depth === 0) return BlockId.Grass;
				if (depth < 4) return BlockId.Dirt;
				return BlockId.Stone;

			case BiomeType.Mountains:
				if (depth === 0 && depth < 2) return BlockId.Grass;
				if (depth < 3) return BlockId.Dirt;
				return BlockId.Stone;

			case BiomeType.SnowyPeaks:
				return BlockId.Stone;

			case BiomeType.Ocean:
				return depth < 2 ? BlockId.Sand : BlockId.Stone;

			default:
				return BlockId.Stone;
		}
	}

	/**
	 * Główna funkcja sample
	 */
	sample(x: number, y: number, z: number): BlockId {
		const biome = this.getBiome(x, z);
		const terrainHeight = this.getTerrainHeight(x, z, biome);

		// Powietrze powyżej terenu
		if (y > terrainHeight) {
			if (y <= this.config.waterLevel) {
				return BlockId.Water;
			}
			return BlockId.Air;
		}

		// Sprawdź cechy geologiczne
		const features = this.getGeologicalFeatures(x, y, z);

		// Jaskinie - tylko powietrze, bez wody
		if (features.hasCave) {
			return BlockId.Air;
		}

		// Żyły rudy
		if (features.hasOreVein && features.oreType) {
			return features.oreType;
		}

		// Normalne bloki
		const depth = terrainHeight - y;
		return this.getSurfaceBlock(biome.type, depth);
	}

	getBiomeAt(x: number, z: number): BiomeData {
		return this.getBiome(x, z);
	}

	generateChunk(
		chunkX: number,
		chunkY: number,
		chunkZ: number,
		chunkSize: number = 16
	): Uint8Array {
		const data = new Uint8Array(chunkSize * chunkSize * chunkSize);

		for (let x = 0; x < chunkSize; x++) {
			for (let y = 0; y < chunkSize; y++) {
				for (let z = 0; z < chunkSize; z++) {
					const worldX = chunkX * chunkSize + x;
					const worldY = chunkY * chunkSize + y;
					const worldZ = chunkZ * chunkSize + z;

					const blockId = this.sample(worldX, worldY, worldZ);
					const index = x + y * chunkSize + z * chunkSize * chunkSize;
					data[index] = blockId;
				}
			}
		}

		return data;
	}

	getConfig(): Readonly<Required<GeneratorConfig>> {
		return { ...this.config };
	}

	setConfig(config: Partial<GeneratorConfig>): void {
		Object.assign(this.config, config);
	}
}
