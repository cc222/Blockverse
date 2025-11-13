import { DebugMenu } from './DebugMenu';
import { InterfaceSettingMenu } from './InterfaceSettingMenu';
import { PauseMenu } from './PauseMenu';
import { SettingsMenu } from './SettingsMenu';

export const menus = [
	PauseMenu.instance,
	SettingsMenu.instance,
	InterfaceSettingMenu.instance,
	DebugMenu.instance
];
