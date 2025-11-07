<script>
	import { InterfaceSettingMenu } from './InterfaceSettingMenu';
	import MenuComponent from './MenuComponent.svelte';
	import { PauseMenu } from './PauseMenu';
	import { SettingsMenu } from './SettingsMenu';
</script>

<MenuComponent menu={PauseMenu.instance} />
<MenuComponent menu={SettingsMenu.instance} />
<MenuComponent menu={InterfaceSettingMenu.instance} />
