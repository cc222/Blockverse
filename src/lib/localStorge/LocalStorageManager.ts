export class LocalStorageManager {
	static getFromStorageOrDefault<T>(key: string, defaultValue: T) {
		let initial = defaultValue;
		const stored = localStorage.getItem(key);
		if (stored) {
			initial = JSON.parse(stored);
		}
		return initial;
	}
	static saveToStorage<T>(key: string, value: T) {
		localStorage.setItem(key, JSON.stringify(value));
	}
}
