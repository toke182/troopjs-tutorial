/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./config",
	"when",
	"jquery",
	"poly/array",
	"troopjs-util/defer"
], function UnweaveModule(config, when, $, Defer) {
	"use strict";

	/**
	 * @class dom.loom.unweave
	 * @mixin dom.loom.config
	 * @mixin Function
	 * @static
	 */

	var UNDEFINED;
	var NULL = null;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_MAP = ARRAY_PROTO.map;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var WEAVE = "weave";
	var UNWEAVE = "unweave";
	var WOVEN = "woven";
	var LENGTH = "length";
	var $WARP = config["$warp"];
	var $WEFT = config["$weft"];
	var ATTR_WEAVE = config[WEAVE];
	var ATTR_WOVEN = config[WOVEN];
	var ATTR_UNWEAVE = config[UNWEAVE];
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
	 * Destroy all widget instances living on this element, that are created
	 * by {@link dom.loom.weave}, it is also to clean up the attributes
	 * and data references to the previously instantiated widgets.
	 *
	 * @localdoc
	 *
	 * It also lives as a jquery plugin as {@link $#method-unweave}.
	 *
	 * @method constructor
	 * @param {...*} [stop_args] Arguments that will be passed to each widget's {@link dom.component.widget#stop stop} method
	 * @return {Promise} Promise to the completion of unweaving all woven widgets.
	 */
	return function unweave(stop_args) {
		// Store stop_args for later
		stop_args = arguments;

		// Map elements
		return when.all(ARRAY_MAP.call(this, function (element) {
			var $element = $(element);
			var $data = $element.data();
			var $warp = $data[$WARP] || ($data[$WARP] = []);
			var $unweave = [];
			var unweave_attr = $element.attr(ATTR_UNWEAVE);
			var unweave_re = [];
			var re = /[\s,]*([\w_\/\.\-]+)(?:@(\d+))?/g;
			var matches;
			var $weft;
			var iMax;
			var i;
			var j;

			/*
			 * Updated attributes according to what have been unweaved.
			 * @param {object} widgets List of stopped widgets.
			 * @private
			 */
			var update_attr = function (widgets) {
				var woven = {};
				var weave = [];
				widgets.forEach(function (widget) {
					var $promise = widget[$WEFT];
					woven[$promise[WOVEN]] = 1;
					weave.push($promise[WEAVE]);
				});

				$element
					// Remove those widgets from data-woven.
					.attr(ATTR_WOVEN, function (index, attr) {
						var result = [];

						if (attr !== UNDEFINED) {
							ARRAY_PUSH.apply(result, attr.split(RE_SEPARATOR).filter(function (part) {
								return !( part in woven );
							}));
						}

						return result[LENGTH] === 0
							? null
							: result.join(" ");
					})
					// Added back those widget names to data-weave.
					.attr(ATTR_WEAVE, function (index, attr) {
						var result = (attr !== UNDEFINED ? attr.split(RE_SEPARATOR) : []).concat(weave);
						return result[LENGTH] === 0 ? null : result.join(" ");
					});
			};

			// Make sure to remove ATTR_UNWEAVE (so we don't try processing this again)
			$element.removeAttr(ATTR_UNWEAVE);

			// Check if we should remove all widgets
			if (unweave_attr === UNDEFINED) {
				// Copy from $warp to $unweave
				ARRAY_PUSH.apply($unweave, $warp);

				// Truncate $warp
				$warp[LENGTH] = 0;
			} else {
				// Iterate unweave_attr (while re matches)
				// matches[1] : widget name - "widget/name"
				// matches[2] : widget instance id - "123"
				while ((matches = re.exec(unweave_attr)) !== NULL) {
					ARRAY_PUSH.call(unweave_re, "^" + matches[1] + "@" + (matches[2] || "\\d+") + "$");
				}

				// Redefine unweave_re as a regexp
				unweave_re = new RegExp(unweave_re.join("|"));

				// Move matching promises from $warp to $unweave
				for (i = j = 0, iMax = $warp[LENGTH]; i < iMax; i++) {
					$weft = $warp[i];

					if (!unweave_re.test($weft[WOVEN])) {
						// Move to new index
						$warp[j++] = $weft;
					}
					else {
						// Push on $weave
						ARRAY_PUSH.call($unweave, $weft);
					}
				}

				// Truncate $warp
				$warp[LENGTH] = j;
			}

			// process with all successful  weaving.
			return when.settle($unweave).then(fulfilled).then(function unweaveWidgets(widgets) {
				return when.map(widgets, function(widget) {
					var deferred;
					var stopPromise;

					// TODO: Detecting TroopJS 1.x widget from *version* property.
					if (widget.trigger) {
						deferred = Defer();
						widget.stop(deferred);
						stopPromise = deferred.promise;
					}
					else {
						stopPromise = widget.stop.apply(widget, stop_args);
					}
					// Add deferred update of attr
					return stopPromise.yield(widget);
				});
			})
			// Updating the weave/woven attributes with stopped widgets.
			.tap(update_attr);
		}));
	};
});
