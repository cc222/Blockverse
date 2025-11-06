import { GameManager } from '$lib/game/GameManger';
import { Menu } from './Menu.svelte';

export class PauseMenu {
	static instance: Menu = new Menu({
		menuOptions: [
			{ label: 'Wznów grę', action: () => PauseMenu.instance.closeMenu() },
			{ label: 'Ustawienia', action: () => console.log('Ustawienia clicked') },
			{ label: 'Osiągnięcia', action: () => console.log('Osiągnięcia clicked') },
			{ label: 'Zapisz i wyjdź', action: () => console.log('Zapisz i wyjdź clicked') },
			{ label: 'Wyjdź bez zapisywania', action: () => console.log('Wyjdź bez zapisywania clicked') }
		],
		onMenuClose: () => {
			GameManager.instance.controlsManager.EnterPointerLock();
		}
	});
}
