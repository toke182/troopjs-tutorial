/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./config",
	"require",
	"when",
	"jquery",
	"troopjs-util/getargs",
	"troopjs-util/defer",
	"poly/array"
], function WeaveModule(config, parentRequire, when, $, getargs, Defer) {
	"use strict";

	/**
	 * @class dom.loom.weave
	 * @mixin dom.loom.config
	 * @mixin Function
	 * @static
	 */

	var UNDEFINED;
	var NULL = null;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_MAP = ARRAY_PROTO.map;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var ARRAY_SHIFT = ARRAY_PROTO.shift;
	var WEAVE = "weave";
	var WOVEN = "woven";
	var LENGTH = "length";
	var $WARP = config["$warp"];
	var $WEFT = config["$weft"];
	var ATTR_WEAVE = config[WEAVE];
	var ATTR_WOVEN = config[WOVEN];
	var RE_SEPARATOR = /[\s,]+/;

	// collect the list of fulfilled promise values from a list of descriptors.
	function fulfilled(descriptors) {
		return descriptors.filter(function(d) {
			return d.state === "fulfilled";
		}).map(function(d) {
			return d.value;
		});
	}

	/**
	 * Instantiate all {@link dom.component.widget widgets}  specified in the {@link dom.loom.config#weave weave attribute}
	 * of this element, and to signal the widget for start with the arguments.
	 *
	 * The weaving will result in:
	 *
	 *  - Updates the {@link dom.loom.config#weave woven attribute} with the created widget instances names.
	 *  - The {@link dom.loom.config#$warp $warp data property} will reference the widget instances.
	 *
	 * @localdoc
	 *
	 * It also lives as a jquery plugin as {@link $#method-weave}.
	 *
	 * **Note:** It's not commonly to use this method directly, use instead {@link $#method-weave jQuery.fn.weave}.
	 *
	 * 	// Create element for weaving.
	 * 	var $el = $('<div data-weave="my/widget(option)"></div>').data("option",{"foo":"bar"});
	 * 	// Instantiate the widget defined in "my/widget" module, with one param read from the element's custom data.
	 * 	$el.weave();
	 *
	 * @method constructor
	 * @param {...*} [start_args] Arguments that will be passed to each widget's {@link dom.component.widget#start start} method
	 * @return {Promise} Promise for the completion of weaving all widgets.
	 */
	return function weave(start_args) {
		// Store start_args for later
		start_args = arguments;

		// Map elements
		return when.all(ARRAY_MAP.call(this, function (element) {
			var $element = $(element);
			var $data = $element.data();
			var $warp = $data[$WARP] || ($data[$WARP] = []);
			var to_weave = [];
			var weave_attr = $element.attr(ATTR_WEAVE) || "";
			var weave_args;
			var re = /[\s,]*(((?:\w+!)?([\w\d_\/\.\-]+)(?:#[^(\s]+)?)(?:\(([^\)]+)\))?)/g;
			var matches;

			/*
			 * Updated attributes according to what have been weaved.
			 * @param {object} widgets List of started widgets.
			 * @private
			 */
			var update_attr = function (widgets) {
				var woven = [];
				var weaved = [];

				widgets.forEach(function (widget) {
					weaved.push(widget[$WEFT][WEAVE]);
					woven.push(widget[$WEFT][WOVEN]);
				});

				$element
					// Add those widgets to data-woven.
					.attr(ATTR_WOVEN, function (index, attr) {
						attr = (attr !== UNDEFINED ? attr.split(RE_SEPARATOR) : []).concat(woven).join(" ");
						return attr || null;
					})
					// Remove only those actually woven widgets from "data-weave".
					.attr(ATTR_WEAVE, function(index, attr) {
						var result = [];
						if (attr !== UNDEFINED) {
							result = to_weave.filter(function(args) {
								return weaved.indexOf(args[WEAVE]) < 0;
							}).map(function(args) { return args[WEAVE]; });
						}
						return result[LENGTH] === 0 ? null : result.join(" ");
					});
			};

			var args;

			// Iterate weave_attr (while re matches)
			// matches[1] : full widget module name (could be loaded from plugin) - "mv!widget/name#1.x(1, 'string', false)"
			// matches[2] : widget name and arguments - "widget/name(1, 'string', false)"
			// matches[3] : widget name - "widget/name"
			// matches[4] : widget arguments - "1, 'string', false"
			while ((matches = re.exec(weave_attr)) !== NULL) {
				/*jshint loopfunc:true*/
				// Create weave_args
				// Require module, add error handler
				// Arguments to pass to the widget constructor.
				args = matches[4];

				// module name, DOM element, widget display name.
				weave_args = [ matches[2], $element.get(0), matches[3] ];

				// Store matches[1] as WEAVE on weave_args
				weave_args[WEAVE] = matches[1];

				// If there were additional arguments
				if (args !== UNDEFINED) {
					// Parse matches[2] using getargs, map the values and append to weave_args
					ARRAY_PUSH.apply(weave_args, getargs.call(args).map(function (value) {
						// If value from $data if key exist
						return value in $data
							? $data[value]
							: value;
					}));
				}

				// Push on $weave
				ARRAY_PUSH.call(to_weave, weave_args);
			}

			// process with all successful weaving.
			return when.settle(to_weave.map(function (widget_args) {
				// Create deferred
				var deferred = when.defer();
				var resolver = deferred.resolver;
				var promise = deferred.promise;
				var module = ARRAY_SHIFT.call(widget_args);

				// Copy WEAVE
				promise[WEAVE] = widget_args[WEAVE];

				// Add promise to $warp, make sure this is called synchronously.
				ARRAY_PUSH.call($warp, promise);

				parentRequire([ module ], function (Widget) {
					var widget;
					var startPromise;

					// detect if weaving has been canceled somehow.
					if ($warp.indexOf(promise) === -1) {
						resolver.reject("cancel");
					}

					try {
						// Create widget instance
						widget = Widget.apply(Widget, widget_args);

						// Add $WEFT to widget
						widget[$WEFT] = promise;

						// Add WOVEN to promise
						promise[WOVEN] = widget.toString();

						// TODO: Detecting TroopJS 1.x widget from *version* property.
						if (widget.trigger) {
							deferred = Defer();
							widget.start(deferred);
							startPromise = deferred.promise;
						}
						else {
							startPromise = widget.start.apply(widget, start_args);
						}

						resolver.resolve(startPromise.yield(widget));
					}
					catch (e) {
						resolver.reject(e);
					}
				}, resolver.reject);

				// Return promise
				return promise;
			})).then(fulfilled)
			// Updating the element attributes with started widgets.
			.tap(update_attr);
		}));
	};
});
