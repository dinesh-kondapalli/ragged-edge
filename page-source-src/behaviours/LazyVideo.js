import { withPlugins, inview, device } from '@spon/plugins';
import gsap from 'gsap';

function LazyVideo({ node, plugins: { inview, device } }) {
	const video = node.querySelector('video');
	if (!video) return () => {};

	let shouldAutoplay = true;
	let isMuted = true;
	let active = [];

	// Parse mobile and desktop settings from data attributes
	const deviceType = window.matchMedia('(pointer: fine)').matches
		? 'mouse'
		: 'touch';

	// Source elements for each breakpoint
	const mobileSourceEl = video.querySelector('source[data-mobile-src]') ?? null;
	const desktopSourceEl =
		video.querySelector('source[data-desktop-src]') ?? null;
	const posterImage = node.querySelector('.video-poster-image__img') ?? null;

	const fadePoster = () => {
		if (posterImage && deviceType === 'touch') {
			gsap.to(posterImage, {
				opacity: 0,
				duration: 0.3,
				delay: 0.3,
				ease: 'linear',
			});
		}
	};

	let isLoaded = false;
	let isInView = false;
	let currentType = null;

	// Load appropriate source and settings
	function loadByType(type) {
		if (currentType === type) return;
		currentType = type;

		if (type === 'desktop' && desktopSourceEl) {
			const src = desktopSourceEl.dataset.desktopSrc;
			desktopSourceEl.src = src;
			video.src = src;
			if (mobileSourceEl) mobileSourceEl.removeAttribute('src');
		} else if (type === 'mobile' && mobileSourceEl) {
			const src = mobileSourceEl.dataset.mobileSrc;
			mobileSourceEl.src = src;
			video.src = src;
			if (desktopSourceEl) desktopSourceEl.removeAttribute('src');
		} else {
			return;
		}

		video.addEventListener(
			'canplay',
			() => {
				fadePoster();
			},
			{ once: true }
		);

		if (!isLoaded) {
			video.load();
			isLoaded = true;
		}

		// Auto-play if attribute present
		if (video.hasAttribute('autoplay')) {
			video.play().catch(() => {
				console.log('autoplay error', video);
			});
		}
	}

	// Intersection callbacks
	function handleEnter() {
		isInView = true;
		const type = window.matchMedia('(min-width: 768px)').matches
			? 'desktop'
			: 'mobile';
		loadByType(type);

		if (video.hasAttribute('autoplay') && shouldAutoplay) {
			video.play().catch(() => {});
		}
	}

	function handleExit() {
		isInView = false;
		if (!video.paused) {
			video.pause();
			video.preload = 'metadata';
		}
	}

	inview.settings = {
		rootMargin: '0px 0px 50% 0px',
		threshold: 0,
	};

	inview.observe(video, {
		enter: handleEnter,
		exit: handleExit,
	});

	// Switch sources on breakpoint changes
	device.at('(min-width: 768px)', {
		on() {
			if (isInView) loadByType('desktop');
		},
		off() {
			if (isInView) loadByType('mobile');
		},
	});

	// Videos w/Controls
	function muteAll() {
		active = [...document.querySelectorAll('video[data-playing]')];
		active.forEach(p => {
			if (p !== video) mute(p);
		});
	}

	function onPlayClick() {
		shouldAutoplay = false;
		if (video.paused) {
			muteAll();

			video.play();
		} else {
			video.pause();
		}
	}
	function unmute(p = video) {
		muteAll();
		p.volume = 1;
		p.muted = false;
		p.removeAttribute('muted');
		isMuted = false;
	}
	function mute(p = video) {
		p.volume = 0;
		p.muted = true;
		p.setAttribute('muted', true);
		isMuted = true;
	}
	function onVolumeClick() {
		shouldAutoplay = false;
		isMuted ? unmute() : mute();
	}

	// UI-only play/pause attribute toggles
	function onPlayEvent() {
		video.setAttribute('data-playing', true);
	}
	function onPauseEvent() {
		video.removeAttribute('data-playing');
	}
	video.addEventListener('play', onPlayEvent);
	video.addEventListener('pause', onPauseEvent);

	const $playButton = node.querySelector('[data-play]');
	const $volumeButton = node.querySelector('[data-volume]');

	$playButton?.addEventListener('click', onPlayClick);
	$volumeButton?.addEventListener('click', onVolumeClick);

	// Cleanup
	return () => {
		if (inview && typeof inview.disconnect === 'function') inview.disconnect();
		if (device && typeof device.cancel === 'function') device.cancel();

		video.removeEventListener('play', onPlayEvent);
		video.removeEventListener('pause', onPauseEvent);
		$playButton?.removeEventListener('click', onPlayClick);
		$volumeButton?.removeEventListener('click', onVolumeClick);

		isLoaded = false;
		isInView = false;
		currentType = null;
	};
}

export default withPlugins(inview, device)(LazyVideo);
