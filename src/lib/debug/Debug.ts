import { DebugLevel } from './DebugLevel';
import type { DebugType } from './DebugType';

type EffectiveLevel = DebugLevel | 'inherit'; // "inherit" = dziedziczy globalny

export class Debug {
	private static globalLevel: DebugLevel = DebugLevel.INFO;

	// Per-typ: "inherit" (domyślnie), konkretny poziom lub NONE (wycisz)
	private static typeLevels = new Map<DebugType, EffectiveLevel>();

	// ===== Konfiguracja globalna =====
	static setLevel(level: DebugLevel) {
		this.globalLevel = level;
	}
	static getLevel(): DebugLevel {
		return this.globalLevel;
	}

	// ===== Konfiguracja per-typ =====
	/**
	 * Ustaw minimalny poziom dla typu.
	 * - "inherit" -> użyj globalnego
	 * - DebugLevel.NONE -> całkowicie wycisz typ
	 * - Inny poziom -> nadpisz globalny
	 */
	static setTypeLevel(type: DebugType, level: EffectiveLevel) {
		this.typeLevels.set(type, level);
	}

	/** Włącz typ (przywraca dziedziczenie, bez nadpisywania poziomu) */
	static enableTypes(...types: DebugType[]) {
		types.forEach((t) => this.typeLevels.set(t, 'inherit'));
	}

	/** Wyłącz (wycisz) typ całkowicie */
	static disableTypes(...types: DebugType[]) {
		types.forEach((t) => this.typeLevels.set(t, DebugLevel.NONE));
	}

	/** Krótko: czy dany typ jest włączony? (po uwzględnieniu konfiguracji) */
	static isTypeEnabled(type: DebugType): boolean {
		const lvl = this.typeLevels.get(type) ?? 'inherit';
		return lvl !== DebugLevel.NONE && this.globalLevel !== DebugLevel.NONE;
	}

	// ===== Logowanie =====
	private static levelOrder: Record<DebugLevel, number> = {
		[DebugLevel.DEBUG]: 0,
		[DebugLevel.INFO]: 1,
		[DebugLevel.WARN]: 2,
		[DebugLevel.ERROR]: 3,
		[DebugLevel.NONE]: 4
	};

	private static shouldLog(type: DebugType, level: DebugLevel): boolean {
		// typ wyciszony?
		const typeCfg = this.typeLevels.get(type) ?? 'inherit';
		if (typeCfg === DebugLevel.NONE) return false;

		// efektywny minimalny poziom: per-typ lub globalny
		const minLevel = typeCfg === 'inherit' ? this.globalLevel : typeCfg;

		if (minLevel === DebugLevel.NONE) return false;

		return this.levelOrder[level] >= this.levelOrder[minLevel];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static log(type: DebugType, level: DebugLevel, message: string, ...data: any[]) {
		if (!this.shouldLog(type, level)) return;

		const prefix = `[${String(type).toUpperCase()}][${String(level).toUpperCase()}]`;
		const color = {
			[DebugLevel.DEBUG]: '\x1b[36m', // cyan
			[DebugLevel.INFO]: '\x1b[32m', // green
			[DebugLevel.WARN]: '\x1b[33m', // yellow
			[DebugLevel.ERROR]: '\x1b[31m', // red
			[DebugLevel.NONE]: '\x1b[0m'
		}[level];

		console.log(`${color}${prefix}\x1b[0m`, message, ...data);
	}
}
Debug.setLevel(DebugLevel.DEBUG); // domyślny poziom globalny
