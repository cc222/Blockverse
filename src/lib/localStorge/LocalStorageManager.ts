import { Debug } from '$lib/debug/Debug';
import { DebugLevel } from '$lib/debug/DebugLevel';
import { DebugType } from '$lib/debug/DebugType';

export class LocalStorageManager {
	static getFromStorageOrDefault<T>(key: string, defaultValue: T) {
		let initial = defaultValue;
		const stored = localStorage.getItem(key);
		if (stored) {
			initial = JSON.parse(stored);
		}
		Debug.log(DebugType.LOCALSTORAGE, DebugLevel.DEBUG, 'getting ' + key + ' value: ' + initial);
		return initial;
	}
	static saveToStorage<T>(key: string, value: T) {
		Debug.log(DebugType.LOCALSTORAGE, DebugLevel.DEBUG, 'setting ' + key + ' value: ' + value);
		localStorage.setItem(key, JSON.stringify(value));
	}
}
