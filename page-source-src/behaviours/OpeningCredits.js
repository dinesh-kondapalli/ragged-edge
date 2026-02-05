import * as THREE from 'three';
import Tempus from 'tempus';

import { vertexShaderFile } from '@/utils/openingCreditsVertexShader.js';
import { fragmentShaderFile } from '@/utils/openingCreditsFragmentShader.js';

function OpeningCredits({ node }) {
	const video = document.getElementById('video-opening-sequence');
	const $homeIntro = document.getElementById('header-home');
	if (!video || !$homeIntro) return () => {};

	video.play();

	// Handle mobile
	if (window.matchMedia('(pointer: coarse)').matches) {
		video.classList.remove('opacity-0');
		return () => {};
	}

	// Avoid duplicate canvases
	let canvas = document.getElementById('hero-canvas');
	if (!canvas) {
		canvas = document.createElement('canvas');
		canvas.id = 'hero-canvas';
		canvas.className = 'fixed top-0 left-0 w-full h-full pointer-events-none';
		$homeIntro.appendChild(canvas);
	}

	// --- THREE.js SETUP ---
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: true,
	});
	const scene = new THREE.Scene();

	const camera = new THREE.OrthographicCamera(
		-1,
		1,
		1,
		-1,
		0,
		1 // Fullscreen quad
	);

	// Video texture
	const videoTexture = new THREE.VideoTexture(video);
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;
	videoTexture.format = THREE.RGBAFormat;

	// Shader material
	const material = new THREE.ShaderMaterial({
		uniforms: {
			videoTexture: { value: videoTexture },
			shiftAmount: { value: 0.0 },
			curveStrength: { value: 0.5 },
			edgeWarp: { value: 0.3 },
		},
		vertexShader: vertexShaderFile,
		fragmentShader: fragmentShaderFile,
	});

	// Geometry: fullscreen quad
	const geometry = new THREE.PlaneGeometry(2, 2);
	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	// Hide original video
	video.style.opacity = '0';

	// Handle window resizing
	const resizeRenderer = () => {
		renderer.setSize(window.innerWidth, window.innerHeight, false);
	};
	window.addEventListener('resize', resizeRenderer);
	resizeRenderer();

	// Mouse shift handling with lerp
	let targetShift = 0;
	let currentShift = 0;
	const lerpFactor = 0.1;

	function updateShift(x) {
		let normalizedX = (x / window.innerWidth) * 2 - 1;
		targetShift = normalizedX * -0.2;
	}

	const mouseMoveHandler = e => updateShift(e.clientX);
	document.addEventListener('mousemove', mouseMoveHandler);

	// Video play enforcement (same as before)
	const forcePlay = () => {
		video.play();
		document.removeEventListener('touchstart', forcePlay);
		document.removeEventListener('click', forcePlay);
	};
	if (video.paused) {
		document.addEventListener('touchstart', forcePlay);
		document.addEventListener('click', forcePlay);
	}
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible' && video.paused) {
			video.play();
		}
	});

	// Animation loop
	function render() {
		if (video.readyState >= 3) {
			videoTexture.needsUpdate = true;
		}

		currentShift += (targetShift - currentShift) * lerpFactor;
		material.uniforms.shiftAmount.value = currentShift;

		material.uniforms.curveStrength.value =
			0.5 + Math.sin(Date.now() * 0.001) * 0.1;

		renderer.render(scene, camera);
	}
	const unsubscribe = Tempus.add(render, {
		priority: 1,
		fps: 60,
	});

	// --- CLEANUP ---
	return () => {
		window.removeEventListener('resize', resizeRenderer);
		document.removeEventListener('mousemove', mouseMoveHandler);
		document.removeEventListener('touchstart', forcePlay);
		document.removeEventListener('click', forcePlay);
		if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
		renderer.dispose();
		unsubscribe();
	};
}

export default OpeningCredits;
