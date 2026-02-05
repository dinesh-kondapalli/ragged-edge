import { eventBus, withPlugins, inview, device } from '@spon/plugins';
import { gsap } from 'gsap';
import Cookies from 'js-cookie';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function HomeIntro({ node, plugins: { inview, device } }) {
	let lockAnim = null;
	//
	// Vars
	//

	const $header = document.getElementById('header');
	const $homeHero = document.getElementById('HomeHero');
	const $startNode = node.querySelector('[data-trigger="start"]');
	const $endNode = node.querySelector('[data-trigger="end"]');
	const $locked = node.querySelector('[data-locked]');
	const $collector = node.querySelector('[data-collector]');
	let $video = document.querySelector('#video-opening-sequence');
	const $logo = node.querySelector('.o-logo');
	const $headerTopBar = node.querySelector('.header-top-bar');
	const $headerBottomBar = node.querySelector('.header-bottom-bar');
	const $headerNav = node.querySelector('.c-nav--home');
	const $mobileBurgerButton = node.querySelector('[data-menu-opener-hero]');
	let $canvas = node.querySelector('#hero-canvas') ?? null;
	if (!$canvas) {
		if (window.matchMedia('(pointer: coarse)').matches) {
			$video.addEventListener('canplay', () => {
				$video.classList.remove('opacity-0');
				$video.play();
			});
		} else {
			$canvas = document.createElement('canvas');
			$canvas.id = 'hero-canvas';
			$canvas.classList.add(
				'fixed',
				'top-0',
				'left-0',
				'w-full',
				'h-full',
				'pointer-events-none'
			);
			node.appendChild($canvas);
		}
	}

	// Seen intro / not
	let introTL = null;
	let hasSeenIntro = Cookies.get('homepageAnimationComplete');
	// let hasSeenIntro = false;

	const $uglyBanners = [
		...document.querySelectorAll(
			'[data-mud-craft-core-cookie-wrapper],[data-mud-craft-core-cache-notice-wrapper],[data-mud-craft-core-cookie-open]'
		),
	];

	if (scrollY >= innerHeight) {
		$header.classList.add('not-at-top');
	}

	// Setup inview observer for video/canvas visibility
	inview.observe(
		node,
		{
			enter: () => {
				$video = document.querySelector('#video-opening-sequence') ?? null;

				gsap.to($homeHero, {
					duration: 0.25,
					ease: 'linear',
					color: '#ffffff',
				});

				gsap.to($uglyBanners, {
					opacity: 0,
					duration: 0.3,
					y: '100%',
					ease: 'linear',
				});

				if ($canvas) {
					gsap.to($canvas, {
						duration: 0.25,
						ease: 'linear',
						opacity: 1,
					});

					// gsap.to($video, {
					// 	duration: 0.25,
					// 	ease: 'linear',
					// 	opacity: 1,
					// 	onStart: () => {
					// 		if ($video) $video.play();
					// 	},
					// });
				} else {
					gsap.to($video, {
						duration: 0.25,
						ease: 'linear',
						opacity: 1,
						onStart: () => {
							if ($video) $video.play();
						},
					});
				}

				$header.classList.remove('not-at-top');
			},
			exit: () => {
				gsap.to($homeHero, {
					duration: 0.25,
					ease: 'linear',
					color: '#181F1F',
				});

				gsap.to($uglyBanners, {
					opacity: 1,
					duration: 0.3,
					y: 0,
					ease: 'linear',
				});

				if ($canvas) {
					gsap.to($canvas, {
						duration: 0.25,
						ease: 'linear',
						opacity: 0,
					});

					// gsap.to($video, {
					// 	duration: 0.25,
					// 	ease: 'linear',
					// 	opacity: 0,
					// 	onComplete: () => {
					// 		$video.pause();
					// 	},
					// });
				} else {
					gsap.to($video, {
						duration: 0.25,
						ease: 'linear',
						opacity: 0,
						onComplete: () => {
							$video.pause();
						},
					});
				}

				$header.classList.add('not-at-top');
			},
		},
		{
			root: null,
			rootMargin: '-20% 0% 20% 0%',
			threshold: 0,
		}
	);

	device.at('(min-width:768px)', {
		on: () => {
			// called when the media query matches the current viewport
			lockAnim = gsap.to($locked, {
				scrollTrigger: {
					trigger: $startNode,
					start: 'top top',
					endTrigger: $endNode,
					end: () =>
						`-=${$locked.offsetHeight / 2 + $collector.offsetHeight}px top`,
					pin: true,
					anticipatePin: 1,
				},
			});
		},

		off: () => {
			// called when the media query does not match the current viewport
			if (lockAnim && typeof lockAnim.kill === 'function')
				lockAnim.scrollTrigger.kill();
		},
	});

	// if Cookie is set, do nothing and return false
	if (hasSeenIntro) {
		if ($headerTopBar) $headerTopBar.remove();
		if ($headerBottomBar) $headerBottomBar.remove();

		gsap.set($logo, {
			scale: 1,
			opacity: 1,
			backgroundColor: 'transparent',
		});

		gsap.set($mobileBurgerButton, {
			opacity: 1,
		});
	} else {
		// REST OF CODE BELOW WON'T RUN IF COOKIE IS SET
		gsap.set($uglyBanners, {
			opacity: 0,
		});

		gsap.set($canvas, {
			scale: 1.5,
		});

		introTL = gsap.timeline({
			paused: 1,
			delay: 1,
			onStart: () => {
				// Moved higher up... WIP
				eventBus.emit('scroll:pause', { toTop: true });
				// document.body.style.position = 'fixed';
				// document.body.style.overflow = 'hidden';
			},
			onComplete: () => {
				// document.body.style.position = 'relative';
				// document.body.style.overflow = 'auto';
				eventBus.emit('scroll:play');
				hasSeenIntro = Cookies.set('homepageAnimationComplete', true, {
					expires: 7,
				});
			},
		});

		// Reveal panel mask
		introTL
			.to($headerTopBar, {
				y: -10,
				duration: 0.2,
				scaleX: 2,
				ease: 'power4.in',
			})
			.to(
				$headerBottomBar,
				{
					y: 10,
					scaleX: 2,
					duration: 0.2,
					ease: 'power4.in',
				},
				'<'
			)
			.to(
				$headerTopBar,
				{
					y: '-100%',
					borderRadius: '0 0 50% 50%',
					scaleX: 1,
					duration: 0.5,
					ease: 'power4.in',
					onComplete: () => {
						$headerTopBar.remove();
					},
				},
				1.5
			)
			.to(
				$headerBottomBar,
				{
					y: '100%',
					borderRadius: '50% 50% 0 0',
					scale: 1,
					duration: 0.5,
					ease: 'power4.in',
					onComplete: () => {
						$headerBottomBar.remove();
					},
				},
				'<'
			)
			.to(
				$canvas,
				{
					scale: 1,
					duration: 0.5,
					ease: 'power4.in',
				},
				'<'
			)
			.fromTo(
				$logo,
				{
					scaleX: 1.15,
					scaleY: 0,
				},
				{
					scaleY: 1,
					scaleX: 1,
					duration: 1,
					ease: 'power4.out',
				},
				1.7
			)
			.to(
				$logo,
				{
					backgroundColor: 'transparent',
					duration: 0.1,
					ease: 'power4.out',
				},
				'<0.04'
			)
			.fromTo(
				$headerNav,
				{
					y: '100%',
				},
				{
					y: 0,
					duration: 0.5,
					ease: 'power4.out',
				},
				2.25
			)
			.to($mobileBurgerButton, {
				opacity: 1,
			});

		introTL.play();
	}

	return () => {
		if (lockAnim) {
			lockAnim.kill();
			lockAnim = null;
		}
		if (inview && typeof inview.disconnect === 'function') {
			try {
				inview.disconnect();
				inview = null;
			} catch (e) {
				console.warn('inview.disconnect() failed:', e);
			}
		}
		if (device && typeof device.cancel === 'function') {
			device.cancel();
			device = null;
		}
	};
}

export default withPlugins(inview, device)(HomeIntro);
