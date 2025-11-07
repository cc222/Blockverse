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
