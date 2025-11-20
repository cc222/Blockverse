/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from 'three';
import { BaseManager } from './BaseManager';

export abstract class BaseManagerAndEventEmiter<
	T extends Record<string, any> = Record<string, any>
> extends BaseManager {
	private _dispatcher = new THREE.EventDispatcher();

	// Publiczne API typowane
	addEventListener<K extends keyof T>(type: K, listener: (event: T[K] & { type: K }) => void) {
		this._dispatcher.addEventListener(type as string, listener as (event: THREE.Event) => void);
	}

	hasEventListener<K extends keyof T>(
		type: K,
		listener: (event: T[K] & { type: K }) => void
	): boolean {
		return this._dispatcher.hasEventListener(
			type as string,
			listener as (event: THREE.Event) => void
		);
	}

	removeEventListener<K extends keyof T>(type: K, listener: (event: T[K] & { type: K }) => void) {
		this._dispatcher.removeEventListener(type as string, listener as (event: THREE.Event) => void);
	}

	dispatchEvent<K extends keyof T>(event: T[K] & { type: K }) {
		this._dispatcher.dispatchEvent(event as unknown as THREE.Event);
	}
}
