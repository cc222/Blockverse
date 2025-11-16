<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';

	// Typy
	type View = 'main' | 'singleplayer' | 'multiplayer' | 'login' | 'register';

	interface World {
		id: number;
		name: string;
		lastPlayed: string;
		seed: string;
	}

	interface FavoriteServer {
		id: number;
		name: string;
		address: string;
		players?: number;
	}

	interface BlockUserData {
		speedX: number;
		speedY: number;
		speedZ: number;
		rotSpeedX: number;
		rotSpeedY: number;
	}

	// Stan aplikacji
	let view = $state<View>('main');
	let nickname = $state('');
	let isLoggedIn = $state(false);

	let worlds: World[] = [
		{ id: 1, name: 'Crystal Caves', lastPlayed: '2 hours ago', seed: 'XK9P' },
		{ id: 2, name: 'Sky Islands', lastPlayed: '1 day ago', seed: 'ZM4L' },
		{ id: 3, name: 'Desert Oasis', lastPlayed: '3 days ago', seed: 'PW7N' }
	];

	let favoriteServers = $state<FavoriteServer[]>([
		{ id: 1, name: '🏆 Oficjalny serwer', address: 'official.blockverse.io', players: 142 },
		{ id: 2, name: '🎨 Creative Hub', address: 'creative.blockverse.io', players: 89 },
		{ id: 3, name: '⚔️ PvP Arena', address: 'pvp.blockverse.io', players: 67 }
	]);

	let serverAddress = $state('');
	let loginEmail = $state('');
	let loginPassword = $state('');
	let registerEmail = $state('');
	let registerPassword = $state('');
	let registerPasswordConfirm = $state('');
	let registerNickname = $state('');

	let newServerName = $state('');
	let newServerAddress = $state('');
	let showAddServerForm = $state(false);

	// Three.js refs
	let canvasContainer: HTMLDivElement;
	let renderer: THREE.WebGLRenderer | null = null;
	let scene: THREE.Scene | null = null;
	let camera: THREE.PerspectiveCamera | null = null;
	let animationId: number | null = null;
	let blocks: THREE.Mesh[] = [];

	function initThreeJS(): void {
		const container = canvasContainer;
		if (!container) return;

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(
			75,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		camera.position.z = 30;

		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio || 1);
		container.appendChild(renderer.domElement);

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const colors = [0x6366f1, 0x8b5cf6, 0xf59e0b, 0x10b981];

		for (let i = 0; i < 50; i++) {
			const material = new THREE.MeshPhongMaterial({
				color: colors[Math.floor(Math.random() * colors.length)],
				transparent: true,
				opacity: 0.75
			});
			const cube = new THREE.Mesh(geometry, material);

			cube.position.x = (Math.random() - 0.5) * 40;
			cube.position.y = (Math.random() - 0.5) * 40;
			cube.position.z = (Math.random() - 0.5) * 40;

			cube.rotation.x = Math.random() * Math.PI;
			cube.rotation.y = Math.random() * Math.PI;

			const userData: BlockUserData = {
				speedX: (Math.random() - 0.5) * 0.04,
				speedY: (Math.random() - 0.5) * 0.04,
				speedZ: (Math.random() - 0.5) * 0.04,
				rotSpeedX: (Math.random() - 0.5) * 0.02,
				rotSpeedY: (Math.random() - 0.5) * 0.02
			};
			cube.userData = userData;

			scene.add(cube);
			blocks.push(cube);
		}

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		const pointLight1 = new THREE.PointLight(0x6366f1, 1, 100);
		pointLight1.position.set(10, 10, 10);
		scene.add(pointLight1);

		const pointLight2 = new THREE.PointLight(0x8b5cf6, 1, 100);
		pointLight2.position.set(-10, -10, -10);
		scene.add(pointLight2);

		window.addEventListener('resize', onResize);

		animate();
	}

	function animate(): void {
		animationId = requestAnimationFrame(animate);

		blocks.forEach((block) => {
			const data = block.userData as BlockUserData;

			block.position.x += data.speedX;
			block.position.y += data.speedY;
			block.position.z += data.speedZ;

			block.rotation.x += data.rotSpeedX;
			block.rotation.y += data.rotSpeedY;

			// Wrap
			if (Math.abs(block.position.x) > 20) block.position.x *= -1;
			if (Math.abs(block.position.y) > 20) block.position.y *= -1;
			if (Math.abs(block.position.z) > 20) block.position.z *= -1;
		});

		if (camera) {
			camera.position.x = Math.sin(Date.now() * 0.0001) * 2;
			camera.position.y = Math.cos(Date.now() * 0.0001) * 2;
			camera.lookAt(0, 0, 0);
		}

		if (renderer && scene && camera) {
			renderer.render(scene, camera);
		}
	}

	function onResize(): void {
		if (!renderer || !camera || !canvasContainer) return;
		camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
	}

	onMount(() => {
		initThreeJS();
	});

	onDestroy(() => {
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
		}
		window.removeEventListener('resize', onResize);
		if (renderer && renderer.domElement && renderer.domElement.parentNode) {
			renderer.domElement.parentNode.removeChild(renderer.domElement);
		}
		if (scene) {
			scene.traverse((obj) => {
				if (obj instanceof THREE.Mesh) {
					if (obj.geometry) obj.geometry.dispose();
					if (obj.material) {
						if (Array.isArray(obj.material)) {
							obj.material.forEach((m) => m.dispose());
						} else {
							obj.material.dispose();
						}
					}
				}
			});
		}
		if (renderer) {
			renderer.dispose();
		}
	});

	// Akcje UI
	function startSingleplayer(): void {
		if (nickname || isLoggedIn) {
			view = 'singleplayer';
		}
	}

	function startMultiplayer(): void {
		if (nickname || isLoggedIn) {
			view = 'multiplayer';
		}
	}

	function showLogin(): void {
		view = 'login';
	}

	function showRegister(): void {
		view = 'register';
	}

	function goBack(): void {
		view = 'main';
		showAddServerForm = false;
	}

	function loadWorld(worldId: number): void {
		alert(`Ładowanie świata ID: ${worldId}...`);
	}

	function createNewWorld(): void {
		alert('Otwieranie kreatora świata...');
	}

	function connectToServer(): void {
		if (serverAddress) {
			alert(`Łączenie z serwerem: ${serverAddress}...`);
		} else {
			alert('Wprowadź adres serwera!');
		}
	}

	function quickConnect(server: string): void {
		alert(`Szybkie łączenie z: ${server}...`);
	}

	function performLogin(): void {
		if (loginEmail && loginPassword) {
			isLoggedIn = true;
			nickname = loginEmail.split('@')[0];
			view = 'main';
			loginEmail = '';
			loginPassword = '';
		} else {
			alert('Wypełnij wszystkie pola!');
		}
	}

	function performRegister(): void {
		if (!registerEmail || !registerPassword || !registerPasswordConfirm || !registerNickname) {
			alert('Wypełnij wszystkie pola!');
			return;
		}
		if (registerPassword !== registerPasswordConfirm) {
			alert('Hasła nie są identyczne!');
			return;
		}
		if (registerNickname.length < 3) {
			alert('Nick musi mieć minimum 3 znaki!');
			return;
		}

		isLoggedIn = true;
		nickname = registerNickname;
		view = 'main';
		registerEmail = '';
		registerPassword = '';
		registerPasswordConfirm = '';
		registerNickname = '';
		alert('Konto zostało utworzone!');
	}

	function logout(): void {
		isLoggedIn = false;
		nickname = '';
	}

	function addFavoriteServer(): void {
		if (!newServerName || !newServerAddress) {
			alert('Wypełnij nazwę i adres serwera!');
			return;
		}

		const newServer: FavoriteServer = {
			id: Date.now(),
			name: newServerName,
			address: newServerAddress
		};

		favoriteServers = [...favoriteServers, newServer];
		newServerName = '';
		newServerAddress = '';
		showAddServerForm = false;
	}

	function removeFavoriteServer(id: number): void {
		favoriteServers = favoriteServers.filter((s) => s.id !== id);
	}

	function handleNicknameInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		nickname = target.value;
	}

	function handleServerAddressInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		serverAddress = target.value;
	}

	function handleLoginEmailInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		loginEmail = target.value;
	}

	function handleLoginPasswordInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		loginPassword = target.value;
	}

	function handleRegisterEmailInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		registerEmail = target.value;
	}

	function handleRegisterPasswordInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		registerPassword = target.value;
	}

	function handleRegisterPasswordConfirmInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		registerPasswordConfirm = target.value;
	}

	function handleRegisterNicknameInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		registerNickname = target.value;
	}

	function handleNewServerNameInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		newServerName = target.value;
	}

	function handleNewServerAddressInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		newServerAddress = target.value;
	}
</script>

<div id="canvas-container" bind:this={canvasContainer} aria-hidden="true"></div>

<div id="app" role="application">
	{#if view !== 'main'}
		<button class="back-btn" onclick={goBack} aria-label="Powrót">←</button>
	{/if}

	{#if view === 'main'}
		<h1 class="logo" role="banner">BLOCKVERSE</h1>

		<div class="card" role="main">
			{#if !isLoggedIn && !nickname}
				<div class="input-group">
					<label for="nickname">Nazwa gracza</label>
					<input
						id="nickname"
						type="text"
						placeholder="Wpisz swoją nazwę..."
						value={nickname}
						oninput={handleNicknameInput}
						maxlength={16}
						aria-required="true"
					/>
				</div>
			{:else}
				<p style="text-align:center;margin-bottom:1.5rem;color:var(--success);font-weight:600;">
					Witaj, {nickname || 'Graczu'}! 👋
				</p>
			{/if}

			<button
				class="btn btn-primary"
				onclick={startSingleplayer}
				disabled={!nickname && !isLoggedIn}>⚡ Jednoosobowa</button
			>

			<button class="btn btn-primary" onclick={startMultiplayer} disabled={!nickname && !isLoggedIn}
				>🌐 Wieloosobowa</button
			>

			{#if !isLoggedIn}
				<div class="divider">lub</div>
				<button class="btn btn-secondary" onclick={showLogin}>🔐 Zaloguj się</button>
				<button class="btn btn-text" onclick={showRegister}>Nie masz konta? Zarejestruj się</button>
			{:else}
				<button class="btn btn-text" onclick={logout}>Wyloguj ({nickname})</button>
			{/if}
		</div>
	{/if}

	{#if view === 'singleplayer'}
		<h1 class="logo">BLOCKVERSE</h1>
		<div class="card">
			<h2 style="margin-bottom:1.5rem;font-size:1.5rem;color:var(--text);">Tryb jednoosobowy</h2>
			<div class="world-list">
				{#each worlds as world}
					<div
						class="world-item"
						role="button"
						tabindex="0"
						onclick={() => loadWorld(world.id)}
						onkeypress={(e) => e.key === 'Enter' && loadWorld(world.id)}
					>
						<div class="world-info">
							<h3>{world.name}</h3>
							<div class="world-meta">{world.lastPlayed}</div>
						</div>
						<div class="world-seed">{world.seed}</div>
					</div>
				{/each}
			</div>
			<button class="btn btn-primary" onclick={createNewWorld}>✨ Stwórz nowy świat</button>
		</div>
	{/if}

	{#if view === 'multiplayer'}
		<h1 class="logo">BLOCKVERSE</h1>
		<div class="card">
			<h2 style="margin-bottom:1.5rem;font-size:1.5rem;color:var(--text);">Tryb wieloosobowy</h2>
			<div class="input-group">
				<label for="server-address">Adres serwera</label>
				<input
					id="server-address"
					type="text"
					placeholder="np. play.blockverse.io:25565"
					value={serverAddress}
					oninput={handleServerAddressInput}
					aria-required="true"
				/>
			</div>
			<button class="btn btn-primary" onclick={connectToServer}>🚀 Połącz</button>

			<div class="divider">Ulubione serwery</div>

			{#if !showAddServerForm}
				<button
					class="btn btn-secondary"
					style="margin-bottom: 1rem;"
					onclick={() => (showAddServerForm = true)}
				>
					➕ Dodaj serwer
				</button>
			{:else}
				<div class="add-server-form">
					<div class="input-group">
						<label for="new-server-name">Nazwa serwera</label>
						<input
							id="new-server-name"
							type="text"
							placeholder="Mój serwer"
							value={newServerName}
							oninput={handleNewServerNameInput}
						/>
					</div>
					<div class="input-group">
						<label for="new-server-address">Adres</label>
						<input
							id="new-server-address"
							type="text"
							placeholder="server.example.com:25565"
							value={newServerAddress}
							oninput={handleNewServerAddressInput}
						/>
					</div>
					<div style="display: flex; gap: 0.5rem;">
						<button class="btn btn-primary" style="flex: 1;" onclick={addFavoriteServer}
							>Dodaj</button
						>
						<button
							class="btn btn-secondary"
							style="flex: 1;"
							onclick={() => (showAddServerForm = false)}>Anuluj</button
						>
					</div>
				</div>
			{/if}

			<div class="world-list">
				{#each favoriteServers as server}
					<div class="world-item">
						<div
							class="world-info"
							role="button"
							tabindex="0"
							style="flex: 1; cursor: pointer;"
							onclick={() => quickConnect(server.address)}
							onkeypress={(e) => e.key === 'Enter' && quickConnect(server.address)}
						>
							<h3>{server.name}</h3>
							<div class="world-meta">
								{#if server.players}
									{server.players} graczy online
								{:else}
									{server.address}
								{/if}
							</div>
						</div>
						{#if server.id > 3}
							<button
								class="remove-btn"
								onclick={(e) => {
									e.stopPropagation();
									removeFavoriteServer(server.id);
								}}
								aria-label="Usuń serwer"
							>
								✕
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if view === 'login'}
		<h1 class="logo">BLOCKVERSE</h1>
		<div class="card">
			<h2 style="margin-bottom:1.5rem;font-size:1.5rem;color:var(--text);">Logowanie</h2>

			<div class="input-group">
				<label for="login-email">Email</label>
				<input
					id="login-email"
					type="email"
					placeholder="twoj@email.pl"
					value={loginEmail}
					oninput={handleLoginEmailInput}
					aria-required="true"
				/>
			</div>

			<div class="input-group">
				<label for="login-password">Hasło</label>
				<input
					id="login-password"
					type="password"
					placeholder="••••••••"
					value={loginPassword}
					oninput={handleLoginPasswordInput}
					aria-required="true"
				/>
			</div>

			<button class="btn btn-primary" onclick={performLogin}>🔓 Zaloguj się</button>
			<button class="btn btn-text" onclick={showRegister}>Nie masz konta? Zarejestruj się</button>
		</div>
	{/if}

	{#if view === 'register'}
		<h1 class="logo">BLOCKVERSE</h1>
		<div class="card">
			<h2 style="margin-bottom:1.5rem;font-size:1.5rem;color:var(--text);">Rejestracja</h2>

			<div class="input-group">
				<label for="register-nickname">Nazwa gracza</label>
				<input
					id="register-nickname"
					type="text"
					placeholder="Twój nick"
					value={registerNickname}
					oninput={handleRegisterNicknameInput}
					maxlength={16}
					aria-required="true"
				/>
			</div>

			<div class="input-group">
				<label for="register-email">Email</label>
				<input
					id="register-email"
					type="email"
					placeholder="twoj@email.pl"
					value={registerEmail}
					oninput={handleRegisterEmailInput}
					aria-required="true"
				/>
			</div>

			<div class="input-group">
				<label for="register-password">Hasło</label>
				<input
					id="register-password"
					type="password"
					placeholder="••••••••"
					value={registerPassword}
					oninput={handleRegisterPasswordInput}
					aria-required="true"
				/>
			</div>

			<div class="input-group">
				<label for="register-password-confirm">Potwierdź hasło</label>
				<input
					id="register-password-confirm"
					type="password"
					placeholder="••••••••"
					value={registerPasswordConfirm}
					oninput={handleRegisterPasswordConfirmInput}
					aria-required="true"
				/>
			</div>

			<button class="btn btn-primary" onclick={performRegister}>📝 Zarejestruj się</button>
			<button class="btn btn-text" onclick={showLogin}>Masz już konto? Zaloguj się</button>
		</div>
	{/if}
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(:root) {
		--primary: #6366f1;
		--primary-dark: #4f46e5;
		--secondary: #8b5cf6;
		--bg-dark: #0f0f23;
		--bg-card: rgba(30, 30, 60, 0.85);
		--text: #e0e0ff;
		--text-dim: #a0a0c0;
		--accent: #f59e0b;
		--success: #10b981;
		--danger: #ef4444;
		--border: rgba(99, 102, 241, 0.3);
	}

	:global(body) {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: var(--bg-dark);
		color: var(--text);
		overflow: hidden;
		height: 100vh;
	}

	#canvas-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	#app {
		position: relative;
		z-index: 2;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.logo {
		font-size: 4rem;
		font-weight: 900;
		background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 2rem;
		text-shadow: 0 0 60px rgba(99, 102, 241, 0.5);
		animation: glow 3s ease-in-out infinite;
		letter-spacing: -0.05em;
	}

	@keyframes glow {
		0%,
		100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.3);
		}
	}

	.card {
		background: var(--bg-card);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border);
		border-radius: 24px;
		padding: 2.5rem;
		width: 100%;
		max-width: 500px;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.input-group {
		margin-bottom: 1.5rem;
	}
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	input {
		width: 100%;
		padding: 0.875rem 1rem;
		background: rgba(15, 15, 35, 0.6);
		border: 2px solid var(--border);
		border-radius: 12px;
		color: var(--text);
		font-size: 1rem;
		transition: all 0.3s ease;
		outline: none;
	}
	input:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
	}
	input::placeholder {
		color: var(--text-dim);
		opacity: 0.6;
	}

	.btn {
		width: 100%;
		padding: 1rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		position: relative;
		overflow: hidden;
		outline: none;
	}
	.btn::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		transform: translate(-50%, -50%);
		transition:
			width 0.6s,
			height 0.6s;
	}
	.btn:active::before {
		width: 300px;
		height: 300px;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		color: white;
		margin-bottom: 0.75rem;
	}
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-secondary {
		background: rgba(99, 102, 241, 0.1);
		color: var(--primary);
		border: 2px solid var(--primary);
		margin-bottom: 0.75rem;
	}
	.btn-secondary:hover {
		background: rgba(99, 102, 241, 0.2);
		transform: translateY(-2px);
	}
	.btn-text {
		background: transparent;
		color: var(--text-dim);
		padding: 0.5rem;
		font-size: 0.875rem;
		text-transform: none;
	}
	.btn-text:hover {
		color: var(--text);
	}

	.world-list {
		max-height: 300px;
		overflow-y: auto;
		margin-bottom: 1.5rem;
	}
	.world-item {
		background: rgba(15, 15, 35, 0.6);
		border: 2px solid var(--border);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 0.75rem;
		transition: all 0.3s ease;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.world-item:hover {
		border-color: var(--primary);
		background: rgba(99, 102, 241, 0.1);
	}
	.world-info {
		flex: 1;
	}
	.world-info h3 {
		font-size: 1.125rem;
		margin-bottom: 0.25rem;
		color: var(--text);
	}
	.world-meta {
		font-size: 0.75rem;
		color: var(--text-dim);
	}
	.world-seed {
		font-family: 'Courier New', monospace;
		background: rgba(99, 102, 241, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.875rem;
		color: var(--accent);
	}

	.remove-btn {
		background: rgba(239, 68, 68, 0.1);
		border: 2px solid var(--danger);
		color: var(--danger);
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		transform: scale(1.1);
	}

	.add-server-form {
		background: rgba(15, 15, 35, 0.4);
		border: 2px solid var(--border);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.divider {
		text-align: center;
		margin: 1.5rem 0;
		position: relative;
		color: var(--text-dim);
		font-size: 0.875rem;
	}
	.divider::before,
	.divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 40%;
		height: 1px;
		background: var(--border);
	}
	.divider::before {
		left: 0;
	}
	.divider::after {
		right: 0;
	}

	.back-btn {
		position: absolute;
		top: 2rem;
		left: 2rem;
		background: rgba(99, 102, 241, 0.1);
		border: 2px solid var(--primary);
		color: var(--primary);
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1.5rem;
		z-index: 10;
	}
	.back-btn:hover {
		background: rgba(99, 102, 241, 0.2);
		transform: scale(1.1);
	}

	@media (max-width: 768px) {
		.logo {
			font-size: 2.5rem;
			margin-bottom: 1.5rem;
		}
		.card {
			padding: 1.5rem;
			max-width: 100%;
			border-radius: 16px;
		}
		.back-btn {
			top: 1rem;
			left: 1rem;
			width: 40px;
			height: 40px;
		}
		.btn {
			padding: 0.875rem 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.logo {
			font-size: 2rem;
		}
		.card {
			padding: 1.25rem;
		}
	}

	:global(.btn:focus-visible),
	:global(input:focus-visible) {
		outline: 3px solid var(--primary);
		outline-offset: 2px;
	}
</style>
