/**
 * Core plugin/behaviour manager for modular DOM applications.
 *
 * Usage:
 *   import { loadApp, registerPlugin, unloadModule } from './pluginSystem';
 *
 *   // In your boot code:
 *   const app = loadApp(moduleLoader, document.body);
 *   // app.hydrate(), app.destroy(), app.cache
 */

const _cache = new Map();

/**
 * Creates a plugin registrar for a behaviour id.
 * This allows plugins to be attached/registered to a module.
 */
function createPluginRegistrar(cache) {
	return function registrarForId(id) {
		return function addPlugin(plugin) {
			const entry = cache.get(id) || { name: id, plugins: [] };
			cache.set(id, {
				...entry,
				plugins: [...(entry.plugins || []), plugin],
			});
		};
	};
}

export const registerPlugin = createPluginRegistrar(_cache);

/**
 * Hydrates modules after DOM mutations (single rAF).
 * If you KNOW DOM is ready, you can call the callback directly.
 */
function afterDOMUpdate(callback) {
	requestAnimationFrame(callback);
	// Tempus.add(callback, { priority: -1 });
	// setTimeout(callback, 0);
	// Or, just call callback() directly if you are sure the DOM is ready.
}

/**
 * Loads a module, registers its destroy function, and supports plugins.
 */
export function loadModule({ module, id, keepAlive, node, ...props }) {
	const prev = _cache.get(id);
	// Clean up old module/plugins if present
	if (prev) {
		const { destroy, plugins = [] } = prev;
		[destroy, ...plugins].forEach(fn => {
			if (typeof fn === 'function') fn();
		});
	}
	// Register plugin registrar (for plugins to register themselves)
	registerPlugin(id);
	const destroy = module({ node, name: id, ...props });
	_cache.set(id, {
		...(_cache.get(id) || { name: id }),
		keepAlive,
		destroy,
		hasLoaded: true,
	});
}

/**
 * Unloads a module, calls its destroy/plugin cleanup, and removes from cache.
 */
export function unloadModule(id) {
	const entry = _cache.get(id);
	if (!entry) return;
	const { destroy, plugins = [], query } = entry;
	// Remove matchMedia listener if present
	if (query && query.mql && query.handle) {
		query.mql.removeEventListener('change', query.handle);
	}
	[destroy, ...plugins].forEach(fn => {
		if (typeof fn === 'function') fn();
	});
	_cache.delete(id);
}

/**
 * Main app loader: dynamically loads modules for [data-behaviour] elements.
 * Returns an object with hydrate, destroy, and cache.
 */
export function loadApp(moduleLoader, context) {
	function fetchBehaviour({ behaviour, id, keepAlive, node }) {
		moduleLoader(behaviour).then(resp => {
			const { default: module } = resp;
			loadModule({ module, id, keepAlive, node });
		});
	}

	/**
	 * Hydrates all eligible [data-behaviour] elements.
	 */
	function hydrate(ctx = document.body) {
		afterDOMUpdate(() => {
			const nodes = Array.from(ctx.querySelectorAll('[data-behaviour]'));
			nodes.forEach(node => {
				const { behaviour: rawBehaviour, query, keepAlive } = node.dataset;
				const id = node.id;
				if (!id || !rawBehaviour || rawBehaviour.split(' ').length > 1) {
					console.warn(
						`Skipping node. Each [data-behaviour] node must have a unique id and exactly one behaviour. Node:`,
						node
					);
					return;
				}
				if (_cache.has(id)) return;
				const behaviour = rawBehaviour.trim();
				const props = { behaviour, id, keepAlive, node };

				_cache.set(id, { name: id, hasLoaded: false });

				if (query) {
					const mql = window.matchMedia(query);
					const handle = ({ matches }) => {
						const item = _cache.get(id);
						if (!item) return;
						if (!matches && item.hasLoaded) {
							const { destroy, plugins = [], ...rest } = item;
							[destroy, ...plugins].forEach(fn => {
								if (typeof fn === 'function') fn();
							});
							_cache.set(id, { ...rest, hasLoaded: false });
						} else if (matches && !item.hasLoaded) {
							fetchBehaviour(props);
						}
					};
					mql.addEventListener('change', handle);
					// Load immediately if matches
					if (mql.matches) fetchBehaviour(props);

					_cache.set(id, {
						..._cache.get(id),
						query: { mql, handle },
					});
				} else {
					fetchBehaviour(props);
				}
			});
		});
	}

	function destroy() {
		// Collect IDs first to avoid mutation issues
		const idsToRemove = [];
		_cache.forEach((entry, name) => {
			const { keepAlive } = entry;
			if (!keepAlive) idsToRemove.push(name);
		});

		idsToRemove.forEach(name => {
			const entry = _cache.get(name);
			if (!entry) return;
			const { query, destroy, plugins = [] } = entry;

			// Remove matchMedia listener
			if (query && query.mql && query.handle) {
				try {
					query.mql.removeEventListener('change', query.handle);
				} catch (err) {
					console.error(
						`Error removing matchMedia listener for module "${name}":`,
						err
					);
				}
			}

			// Destroy main module
			if (typeof destroy === 'function') {
				try {
					destroy();
				} catch (err) {
					console.error(`Error destroying module "${name}":`, err);
				}
			}

			// Destroy plugins
			plugins.forEach((fn, idx) => {
				if (typeof fn === 'function') {
					try {
						fn();
					} catch (err) {
						console.error(
							`Error destroying plugin #${idx} for module "${name}":`,
							err
						);
					}
				}
			});

			// Always attempt to remove from cache
			_cache.delete(name);
		});

		// Optionally, check if cache is empty
		if (_cache.size > 0) {
			console.warn(
				'Some modules remain in cache after destroy:',
				Array.from(_cache.keys())
			);
		}
	}

	return {
		hydrate,
		destroy,
		get cache() {
			return _cache;
		},
	};
}

// For debugging/dev: expose the cache for read-only access
export function getCache() {
	return _cache;
}
