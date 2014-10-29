/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./pattern",
	"when"
], function SequenceModule(RE_PHASE, when) {
	"use strict";

	/**
	 * @class core.pubsub.runner.sequence
	 * @implement core.event.emitter.runner
	 * @private
	 * @static
	 * @alias feature.runner
	 */

	var UNDEFINED;
	var CONTEXT = "context";
	var CALLBACK = "callback";
	var HEAD = "head";
	var NEXT = "next";
	var PHASE = "phase";
	var MEMORY = "memory";

	/**
	 * @method constructor
	 * @inheritdoc
	 * @localdoc Run event handlers **asynchronously** in "sequence", passing to each handler the same arguments from emitting.
	 * @return {Promise}
	 */
	return function sequence(event, handlers, args) {
		var context = event[CONTEXT];
		var callback = event[CALLBACK];
		var results = [];
		var resultsCount = 0;
		var candidate;
		var candidates = [];
		var candidatesCount = 0;

		// Iterate handlers
		for (candidate = handlers[HEAD]; candidate !== UNDEFINED; candidate = candidate[NEXT]) {
			// Filter candidate[CONTEXT] if we have context
			if (context !== UNDEFINED && candidate[CONTEXT] !== context) {
				continue;
			}

			// Filter candidate[CALLBACK] if we have callback
			if (callback !== UNDEFINED && candidate[CALLBACK] !== callback) {
				continue;
			}

			// Add to candidates
			candidates[candidatesCount++] = candidate;
		}

		// Reset candidatesCount
		candidatesCount = 0;

		/**
		 * Internal function for sequential execution of candidates candidates
		 * @ignore
		 * @param {Array} [result] result from previous candidate callback
		 * @param {Boolean} [skip] flag indicating if this result should be skipped
		 * @return {Promise} promise of next candidate callback execution
		 */
		var next = function (result, skip) {
			/*jshint curly:false*/
			var candidate;
			var context;

			// Store result if no skip
			if (skip !== true) {
				results[resultsCount++] = result;
			}

			// TODO Needs cleaner implementation
			// Iterate candidates while candidate has a context and that context is in a blocked phase
			while ((candidate = candidates[candidatesCount++]) // Has next candidate
				&& (context = candidate[CONTEXT])                // Has context
				&& RE_PHASE.test(context[PHASE]));               // In blocked phase

			// Return promise of next callback, or a promise resolved with result
			return candidate !== UNDEFINED
				? when(candidate[CALLBACK].apply(context, args), next)
				: (handlers[MEMORY] = args) === args && when.resolve(results);
		};

		return next(args, true);
	}
});
