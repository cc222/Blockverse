import { BlockId } from '../blocks';
import { BiomeType, type BiomeData } from './Biomes';
import { SimplexNoise } from './SimplexNoise';

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
			caveScale: 0.01,
			caveThreshold: 0.15, // niszy = mniej jaskiń
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
		if (this.config.enableCaves) {
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
