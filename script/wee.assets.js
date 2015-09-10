(function(W, U) {
	'use strict';

	var groups = {},
		loaded = {},
		root = '',
		index = 0;

	W.fn.make('assets', {
		/**
		 * Cache existing CSS and JavaScript asset references
		 *
		 * @constructor
		 */
		_construct: function() {
			W.$each('link[rel="stylesheet"], script[src]', function(el) {
				loaded[el.src || el.href] = el;
			});
		},

		/**
		 * Get currently bound resource root or set root with specified value
		 *
		 * @param {string} [value]
		 * @returns {string} root
		 */
		root: function(value) {
			if (value) {
				root = value;
			}

			return root;
		},

		/**
		 * Load specified assets with specified set of options
		 *
		 * @param {object} options
		 * @param {(Array|string)} [options.files]
		 * @param {(Array|string)} [options.js]
		 * @param {(Array|string)} [options.css]
		 * @param {(Array|string)} [options.img]
		 * @param {(Array|function|string)} [options.success]
		 * @param {(Array|function|string)} [options.error]
		 * @param {string} [options.group]
		 * @param {boolean} [options.cache=false]
		 */
		load: function(options) {
			var conf = W.$extend({
					files: [],
					js: [],
					css: [],
					img: []
				}, options),
				files = W.$toArray(conf.files),
				js = W.$toArray(conf.js),
				css = W.$toArray(conf.css),
				img = W.$toArray(conf.img),
				root = conf.root !== U ? conf.root : this.root(),
				now = Date.now(),
				i = 0,
				assets = [],
				type;

			// Create group name if not specified
			if (! conf.group) {
				conf.group = 'load-' + now;
			}

			// Determine file type
			for (; i < files.length; i++) {
				var ext = files[i].split('.').pop().split(/#|\?/)[0];
				type = ext == 'js' || ext == 'css' ?
					ext : /(gif|jpe?g|png|svg)$/i.test(ext) ?
						'img' : '';

				if (type) {
					assets[files[i]] = type;
				}
			}

			for (i = 0; i < js.length; i++) {
				assets[js[i]] = 'js';
			}

			for (i = 0; i < css.length; i++) {
				assets[css[i]] = 'css';
			}

			for (i = 0; i < img.length; i++) {
				assets[img[i]] = 'img';
			}

			// Set file array length to check against
			groups[conf.group] = [
				Object.keys(assets).length,
				conf,
				0
			];

			// Request each specified file
			for (var file in assets) {
				// Reset root if the URL is absolute
				if (root && /^(https?:)?\/\//i.test(file)) {
					root = '';
				}

				type = assets[file];
				file = root + file;

				if (! loaded[file]) {
					if (conf.cache === false) {
						file += (file.indexOf('?') < 0 ? '?' : '&') + now;
					}

					this.$private.load(file, type, conf);
				}
			}
		},

		/**
		 * Remove one or more files from the DOM
		 *
		 * @param {(Array|string)} files
		 * @param {string} [root]
		 */
		remove: function(files, root) {
			files = W.$toArray(files);
			root = root || '';

			var keys = Object.keys(files),
				a = W._doc.createElement('a'),
				i = 0;

			for (; i < keys.length; i++) {
				var key = keys[i],
					src = root + files[key];
				a.href = src;
				src = a.href;

				var el = loaded[src];

				if (el !== U) {
					el.parentNode.removeChild(el);
					el = null;

					delete loaded[src];
				}
			}
		},

		/**
		 * When specified references are ready execute callback
		 *
		 * @param {string} group
		 * @param {object} [options]
		 * @param {Array} [options.args]
		 * @param {object} [options.scope]
		 * @param {(Array|function|string)} [options.success]
		 * @param {(Array|function|string)} [options.error]
		 * @param {boolean} [poll=false]
		 * @returns {boolean} ready
		 */
		ready: function(group, options, poll) {
			var complete = groups[group] < 1;

			if (options === U) {
				return complete;
			}

			if (complete) {
				var conf = W.$extend(groups[group][1], options);
				options = {
					args: conf.args,
					scope: conf.scope
				};

				if (conf.error && groups[group][2] > 0) {
					W.$exec(conf.error, options);
				} else if (conf.success) {
					W.$exec(conf.success, options);
				}
			} else if (poll) {
				setTimeout(function() {
					W.assets.ready(group, {}, true);
				}, 20);
			}
		}
	}, {
		/**
		 * Request specific file
		 *
		 * @private
		 * @param {string} path
		 * @param {string} type
		 * @param {object} [conf]
		 * @param {string} [conf.group]
		 * @param {boolean} [conf.async=false]
		 */
		load: function(path, type, conf) {
			var scope = this,
				head = W._doc.getElementsByTagName('head')[0],
				group = conf.group;

			// Load file based on extension
			if (type == 'js') {
				var js = W._doc.createElement('script'),
					fn = function() {
						loaded[js.src] = js;
						scope.done(group);
					};

				if (W._legacy) {
					js.onreadystatechange = function() {
						var rs = js.readyState;

						if (rs != 'complete' && rs != 'loaded') {
							return;
						}

						fn();
					};
				} else {
					js.async = conf.async === true;

					js.onload = fn;

					js.onerror = function() {
						scope.fail(group);
					};
				}

				js.src = path;
				head.appendChild(js);
			} else if (type == 'css') {
				var link = W._doc.createElement('link');

				link.rel = 'stylesheet';
				link.href = path;

				if (W._legacy) {
					index++;
					var id = 'load-' + index;
					link.id = id;

					link.attachEvent('onload', function() {
						var sheets = W._doc.styleSheets,
							i = sheets.length,
							text;

						try {
							while (i--) {
								var sheet = sheets[i];

								if (sheet.id == id) {
									text = sheet.cssText;
									scope.done(group);
									return;
								}
							}
						} catch (e) {}

						if (! text) {
							scope.fail(group);
						}
					});
				} else {
					link.addEventListener('load', function() {
						scope.done(group);
					}, false);

					link.addEventListener('error', function() {
						scope.fail(group);
					}, false);
				}

				head.appendChild(link);
			} else if (type == 'img') {
				var img = new Image();

				img.onload = function() {
					scope.done(group);
				};

				img.onerror = function() {
					scope.fail(group);
				};

				img.src = path;
			}
		},

		/**
		 * Decrement remaining count of assets to be loaded
		 *
		 * @private
		 * @param {string} group
		 */
		done: function(group) {
			groups[group][0]--;
			this.$public.ready(group, {}, false);
		},

		/**
		 * Track failed resources
		 *
		 * @private
		 * @param {string} group
		 */
		fail: function(group) {
			groups[group][2]++;
			this.done(group);
		}
	});
})(Wee, undefined);