(function(W) {
	'use strict';

	var events = [],
		id = 0,
		bound,
		current,

		/**
		 * Bind individual rule
		 *
		 * @private
		 * @param {object} conf - breakpoint rules
		 * @param {Array} [conf.args] - callback arguments
		 * @param {function} conf.callback
		 * @param {boolean} [conf.each=false] - execute for each matching breakpoint
		 * @param {boolean} [conf.init=true] - check event on load
		 * @param {int} [conf.max] - maximum breakpoint value
		 * @param {int} [conf.min] - minimum breakpoint value
		 * @param {boolean} [conf.once=false] - only execute the callback once
		 * @param {object} [conf.scope] - callback scope
		 * @param {int} [conf.size] - specific breakpoint value
		 * @param {boolean} [conf.watch=true] - check event on screen resize
		 * @param {string} [conf.namespace] - namespace the event
		 */
		_addRule = function(conf) {
			// Attach unique identifier
			conf.i = id++;

			// Only setup watching when enabled
			if (conf.watch !== false) {
				events.push(conf);

				// Only attach event once
				if (! bound) {
					var run = _run.bind(this, false, 0, null);
					bound = 1;
					events = [conf];

					// Attach resize event
					W._win.addEventListener('resize', run);
				}
			}

			// Evaluate rule immediately if not disabled
			if (conf.init !== false) {
				_run(true, [conf]);
			}
		},

		/**
		 * Check mapped rules for matching conditions
		 *
		 * @private
		 * @param {boolean} [init=false] - initial page load
		 * @param {Array} [rules] - breakpoint rules
		 */
		_run = function(init, rules, namespace) {
			var size = W.screen.size(),
				evts = rules || events,
				i;

			// If breakpoint has been hit or resize logic initialized
			if (size && (init || size !== current)) {
				if (namespace) {
					evts = evts.filter(function(obj) {
						return obj.namespace === namespace;
					});
				}

				i = evts.length;

				while (i--) {
					var evt = evts[i];

					if (_eq(evt, size, init)) {
						var f = init && ! current,
							data = {
								dir: f ? 0 : (size > current ? 1 : -1),
								init: f,
								prev: current,
								size: size
							};

						W.$exec(evt.callback, {
							args: evt.args ? [data].concat(evt.args) : [data],
							scope: evt.scope
						});

						// Disable future execution if once
						if (evt.once) {
							events = events.filter(function(obj) {
								return obj.i !== evt.i;
							});
						}
					}
				}

				// Cache current value
				current = size;
			}
		},

		/**
		 * Compare event rules against current size
		 *
		 * @private
		 * @param {object} evt
		 * @param {number} size
		 * @param {boolean} init
		 * @returns {boolean}
		 */
		_eq = function(evt, size, init) {
			var sz = evt.size,
				mn = evt.min,
				mx = evt.max,
				ex = evt.each || init;

			// Check match against rules
			return (! sz && ! mn && ! mx) ||
				(sz && sz === size) ||
				(mn && size >= mn && (ex || current < mn) && (! mx || size <= mx)) ||
				(mx && size <= mx && (ex || current > mx) && (! mn || size >= mn));
		};

	W.screen = {
		/**
		 * Retrieve bound mappings
		 *
		 * @param {string} namespace
		 * @returns {*}
		 */
		bound: function(namespace) {
			if (! namespace) {
				return events;
			}

			return events.filter(function(obj) {
				return obj.namespace === namespace;
			});
		},

		/**
		 * Get current breakpoint value
		 *
		 * @returns {number} size
		 */
		size: function() {
			return parseFloat(
				getComputedStyle(W._html, null)
					.getPropertyValue('font-family')
					.replace(/[^0-9\.]+/g, '')
			);
		},

		/**
		 * Map conditional events to breakpoint values
		 *
		 * @param {(Array|object)} rules - breakpoint rules
		 * @param {Array} [rules.args] - callback arguments
		 * @param {function} rules.callback
		 * @param {boolean} [rules.each=false] - execute for each matching breakpoint
		 * @param {boolean} [rules.init=true] - check event on load
		 * @param {int} [rules.max] - maximum breakpoint value
		 * @param {int} [rules.min] - minimum breakpoint value
		 * @param {string} [rules.namespace] - namespace the event
		 * @param {boolean} [rules.once=false] - only execute the callback once
		 * @param {object} [rules.scope] - callback scope
		 * @param {int} [rules.size] - specific breakpoint value
		 * @param {boolean} [rules.watch=true] - check event on screen resize
		 */
		map: function(rules) {
			var sets = W.$toArray(rules),
				i = sets.length;

			while (i--) {
				_addRule(sets[i]);
			}
		},

		/**
		 * Evaluate the current breakpoint
		 */
		run: function(namespace) {
			_run(true, null, namespace);
		},

		/**
		 * Remove events from bound rules
		 *
		 * @param {string} [namespace] - remove screen events in this namespace
		 */
		reset: function(namespace) {
			events = events.filter(function(obj) {
				return obj.namespace !== namespace;
			});
		}
	};
})(Wee);