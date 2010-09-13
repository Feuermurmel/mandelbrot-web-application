/**
 * jQuery.timers - Timer abstractions for jQuery
 * Written by Michael Schwarz <michi.schwarz@gmail.com>
 * Licensed under the WTFPL (http://sam.zoy.org/wtfpl/).
 * Date: 2010/03/28
 *
 * @author Michael Schwarz
 * @version 1.5.0
 *
 **/

Timer = (function () {
	function parseTime(value) {
		if (typeof value == "number") {
			return Math.floor(value * 1000);
		} else if (typeof value == "string") {
			var powers = {
				"ms": 1,
				"s": 1000,
				"m": 60 * 1000,
				"h": 60 * 60 * 1000
			};
			var regex = new RegExp("^([0-9]+(?:\\.[0-9]*)?|\\.[0-9]+) *(m?s|m|h)$");
			var result = regex.exec(jQuery.trim(value.toString()));
			
			if (result === null)
				throw "Cannot parse time spec: " + value;
			else
				return parseFloat(result[1]) * powers[result[2]];
		} else {
			throw "Cannot parse time spec: " + value;
		}
	};
	
	function clearTimer(timer) {
		if (timer.id != undefined)
			window.clearTimeout(timer.id);
		
		delete timer.id;
		timer.cleanup(timer.timer);
	};
	
	function setTimer(timer) {
		var now = (new Date()).getTime();
		var nextTime;
		
		// ugly
		if (timer.belay && timer.interval > 0)
			timer.count = Math.min(Math.max(Math.floor((now - timer.startTime) / timer.interval), 0), timer.times - 1);
		
		timer.count += 1;
		nextTime = timer.startTime + timer.count * timer.interval;
		
		timer.id = window.setTimeout(function () {
			timer.timer.count = timer.count
			delete timer.id;
			timer.handler(timer.timer);
			
			if (timer.stopped || timer.count >= timer.times)
				clearTimer(timer);
			else
				setTimer(timer);
		}, nextTime - now);
	};
	
	function makeTimer(opts) {
		var timer = {
			"startTime": (new Date()).getTime() + parseTime(opts.delay),
			"interval": parseTime(opts.interval),
			"belay": opts.belay,
			"times": opts.times,
			"count": 0,
			"handler": opts.handler,
			"cleanup": opts.cleanup,
			"stopped": false,
			"timer": {
				"count": 0,
				"stop": function () {
					timer.stopped = true;
					
					if (timer.id != undefined)
						clearTimer(timer);
				}
			}
		};
		
		setTimer(timer);
		
		return timer;
	};
	
	// timer([ delay : Number | String = interval ], interval : Number | String, handler : Function <Timer>, [ cleanup : Function <Timer> ], [ times : Integer = inf ], [ belay : boolean = false ]) : Timer
	// timer(handler : Function <Timer>, [ cleanup : Function <Timer> ], delay : Number | String) : Timer	
	return function () {
		var args = $.makeArray(arguments);
		var numArgs = args.length;
		var opts = { };
		
		if (typeof args[0] == "number" || typeof args[0] == "string") {
			// We're being called with the first form.
			opts.delay = args[0];
			args.shift();
			
			if (typeof args[0] == "number" || typeof args[0] == "string") {
				// We have a delay parameter.
				opts.interval = args[0];
				args.shift();
			} else {
				opts.interval = opts.delay;
			}
			
			if (typeof args[0] == "function") {
				opts.handler = args[0];
				args.shift();
			} else {
				throw "Excepted a function as argument " + (numArgs - args.length + 1) + ".";
			}
			
			if (typeof args[0] == "function") {
				// We have a cleanup parameter.
				opts.cleanup = args[0];
				args.shift();
			} else {
				opts.cleanup = $.noop;
			}
			
			if (typeof args[0] == "number") {
				// We have a times parameter.
				opts.times = args[0];
				args.shift();
			} else {
				opts.times = Infinity;
			}
			
			if (typeof args[0] == "boolean") {
				// We have a belay parameter.
				opts.belay = args[0];
				args.shift();
			} else {
				opts.belay = false;
			}
		} else if (typeof args[0] == "function") {
			// We're being called with the second form.
			opts.times = 1;
			opts.handler = args[0];
			opts.interval = 0;
			opts.belay = false;
			args.shift();
			
			if (typeof args[0] == "function") {
				// We have a cleanup parameter.
				opts.cleanup = args[0];
				args.shift();
			} else {
				opts.cleanup = $.noop;
			}
			
			if (typeof args[0] == "number" || typeof args[0] == "string") {
				// We have a delay parameter.
				opts.delay = args[0];
				args.shift();
			} else {
				opts.delay = 0;
			}
		} else {
			throw "Excepted a number, string or function as argument " + (numArgs - args.length + 1) + ".";
		}
		
		if (args.length > 0)
			throw "Excess arguments after argument " + (numArgs - args.length) + ".";
		
		return makeTimer(opts).timer;
	};
}) ();
