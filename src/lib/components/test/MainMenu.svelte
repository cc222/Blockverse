<script>
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';

	// Stan aplikacji
	let view = 'main'; // 'main' | 'singleplayer' | 'multiplayer' | 'login'

	let nickname = '';
	let isLoggedIn = '';

	let worlds = [
		{ id: 1, name: 'Crystal Caves', lastPlayed: '2 hours ago', seed: 'XK9P' },
		{ id: 2, name: 'Sky Islands', lastPlayed: '1 day ago', seed: 'ZM4L' },
		{ id: 3, name: 'Desert Oasis', lastPlayed: '3 days ago', seed: 'PW7N' }
	];

	let serverAddress = '';
	let loginEmail = '';
	let loginPassword = '';

	// Three.js refs
	let canvasContainer;
	let renderer, scene, camera, animationId;
	let blocks = [];

	function initThreeJS() {
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

			cube.userData = {
				speedX: (Math.random() - 0.5) * 0.04,
				speedY: (Math.random() - 0.5) * 0.04,
				speedZ: (Math.random() - 0.5) * 0.04,
				rotSpeedX: (Math.random() - 0.5) * 0.02,
				rotSpeedY: (Math.random() - 0.5) * 0.02
			};

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

	function animate() {
		animationId = requestAnimationFrame(animate);

		blocks.forEach((block) => {
			block.position.x += block.userData.speedX;
			block.position.y += block.userData.speedY;
			block.position.z += block.userData.speedZ;

			block.rotation.x += block.userData.rotSpeedX;
			block.rotation.y += block.userData.rotSpeedY;

			// Wrap
			if (Math.abs(block.position.x) > 20) block.position.x *= -1;
			if (Math.abs(block.position.y) > 20) block.position.y *= -1;
			if (Math.abs(block.position.z) > 20) block.position.z *= -1;
		});

		camera.position.x = Math.sin(Date.now() * 0.0001) * 2;
		camera.position.y = Math.cos(Date.now() * 0.0001) * 2;
		camera.lookAt(0, 0, 0);

		renderer && renderer.render(scene, camera);
	}

	function onResize() {
		if (!renderer || !camera || !canvasContainer) return;
		camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
	}

	onMount(() => {
		initThreeJS();
	});

	onDestroy(() => {
		//cancelAnimationFrame(animationId);
		window.removeEventListener('resize', onResize);
		if (renderer && renderer.domElement && renderer.domElement.parentNode)
			renderer.domElement.parentNode.removeChild(renderer.domElement);
		// dispose
		if (scene) {
			scene.traverse((obj) => {
				if (obj.geometry) obj.geometry.dispose && obj.geometry.dispose();
				if (obj.material) {
					if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose && m.dispose());
					else obj.material.dispose && obj.material.dispose();
				}
			});
		}
	});

	// Akcje UI
	function startSingleplayer() {
		if (nickname || isLoggedIn) {
			view = 'singleplayer';
		}
	}

	function startMultiplayer() {
		if (nickname || isLoggedIn) {
			view = 'multiplayer';
		}
	}

	function showLogin() {
		view = 'login';
	}

	function goBack() {
		view = 'main';
	}

	function loadWorld(worldId) {
		alert(`Ładowanie świata ID: ${worldId}...`);
	}

	function createNewWorld() {
		alert('Otwieranie kreatora świata...');
	}

	function connectToServer() {
		if (serverAddress) {
			alert(`Łączenie z serwerem: ${serverAddress}...`);
		} else {
			alert('Wprowadź adres serwera!');
		}
	}

	function quickConnect(server) {
		alert(`Szybkie łączenie z: ${server}...`);
	}

	function performLogin() {
		if (loginEmail && loginPassword) {
			isLoggedIn = true;
			nickname = loginEmail.split('@')[0];
			localStorage.setItem('authToken', 'demo_token');
			localStorage.setItem('nickname', nickname);
			view = 'main';
		} else {
			alert('Wypełnij wszystkie pola!');
		}
	}

	function logout() {
		isLoggedIn = false;
		nickname = '';
		localStorage.removeItem('authToken');
		localStorage.removeItem('nickname');
	}
</script>

<div id="canvas-container" bind:this={canvasContainer} aria-hidden="true"></div>

<div id="app" role="application">
	{#if view !== 'main'}
		<button class="back-btn" on:click={goBack} aria-label="Powrót">←</button>
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
						bind:value={nickname}
						maxlength="16"
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
				on:click={startSingleplayer}
				disabled={!nickname && !isLoggedIn}
				aria-disabled={!nickname && !isLoggedIn}>⚡ Jednoosobowa</button
			>

			<button
				class="btn btn-primary"
				on:click={startMultiplayer}
				disabled={!nickname && !isLoggedIn}
				aria-disabled={!nickname && !isLoggedIn}>🌐 Wieloosobowa</button
			>

			{#if !isLoggedIn}
				<div class="divider">lub</div>
				<button class="btn btn-secondary" on:click={showLogin}>🔐 Zaloguj się</button>
			{:else}
				<button class="btn btn-text" on:click={logout}>Wyloguj ({nickname})</button>
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
						on:click={() => loadWorld(world.id)}
						on:keypress={(e) => e.key === 'Enter' && loadWorld(world.id)}
					>
						<div class="world-info">
							<h3>{world.name}</h3>
							<div class="world-meta">{world.lastPlayed}</div>
						</div>
						<div class="world-seed">{world.seed}</div>
					</div>
				{/each}
			</div>
			<button class="btn btn-primary" on:click={createNewWorld}>✨ Stwórz nowy świat</button>
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
					bind:value={serverAddress}
					aria-required="true"
				/>
			</div>
			<button class="btn btn-primary" on:click={connectToServer}>🚀 Połącz</button>

			<div class="divider">Popularne serwery</div>

			<div class="world-list">
				<div
					class="world-item"
					role="button"
					tabindex="0"
					on:click={() => quickConnect('official.blockverse.io')}
				>
					<div class="world-info">
						<h3>🏆 Oficjalny serwer</h3>
						<div class="world-meta">142 graczy online</div>
					</div>
				</div>

				<div
					class="world-item"
					role="button"
					tabindex="0"
					on:click={() => quickConnect('creative.blockverse.io')}
				>
					<div class="world-info">
						<h3>🎨 Creative Hub</h3>
						<div class="world-meta">89 graczy online</div>
					</div>
				</div>

				<div
					class="world-item"
					role="button"
					tabindex="0"
					on:click={() => quickConnect('pvp.blockverse.io')}
				>
					<div class="world-info">
						<h3>⚔️ PvP Arena</h3>
						<div class="world-meta">67 graczy online</div>
					</div>
				</div>
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
					bind:value={loginEmail}
					aria-required="true"
				/>
			</div>

			<div class="input-group">
				<label for="login-password">Hasło</label>
				<input
					id="login-password"
					type="password"
					placeholder="••••••••"
					bind:value={loginPassword}
					aria-required="true"
				/>
			</div>

			<button class="btn btn-primary" on:click={performLogin}>🔓 Zaloguj się</button>
			<button
				class="btn btn-text"
				on:click={() => alert('Funkcja rejestracji będzie dostępna wkrótce!')}
				>Nie masz konta? Zarejestruj się</button
			>
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
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
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
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.world-item:hover {
		border-color: var(--primary);
		background: rgba(99, 102, 241, 0.1);
		transform: translateX(4px);
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

	.loading-dots {
		display: inline-block;
	}
	.loading-dots::after {
		content: '.';
		animation: dots 1.5s steps(4, end) infinite;
	}
	@keyframes dots {
		0%,
		20% {
			content: '.';
		}
		40% {
			content: '..';
		}
		60%,
		100% {
			content: '...';
		}
	}

	:global(.btn:focus-visible),
	:global(input:focus-visible) {
		outline: 3px solid var(--primary);
		outline-offset: 2px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
