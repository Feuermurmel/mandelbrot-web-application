util = {
	// Turns broken arrays into real ones.
	makeArray: function (arr) {
		var res = [];
		
		for (var i = 0; i < arr.length; i += 1)
			res.push(arr[i]);
		
		return res;
	},
	extend: function (obj) {
		util.makeArray(arguments).slice(1).map(function (v) {
			lambda.map(v, function (k, v) {
				obj[k] = v;
			});
		});
		
		return obj;
	},
	// Non-broken version of the modulo operator.
	modulo: function (num, div) {
		return num - Math.floor(num / div) * div;
	},
	// Sign of a number.
	sign: function (num) {
		if (num > 0)
			return 1;
		else if (num < 0)
			return -1;
		else
			return 0;
	},
/*	objSelect: function (obj, keys) {
		var res = { };
		
		keys.map(function (k) {
			if k in obj
				res[k] = obj[k];
		});
		
		return res;
	}*/
	// Removes duplicate elements from an array.
	removeDuplicates: function (arr) {
		var res = [];
		
		outer: for (var i in arr) {
			for (var j in res)
				if (res[j] == arr[i]) 
					continue outer;
			
			res.push(arr[i]);
		}
		
		return res;
	},
	bindGlobalOnMouseUpOnce: function (fn) {
		function onUp() {
			$(document).unbind("mouseup", onUp);
			fn();
		};
		
		$(document).mouseup(onUp);
	},
	// calls fn with any given additional arguments and logs and discards any thrown exception
	eatExceptions: function (fn) {
		try {
			return fn.apply(null, util.makeArray(arguments).slice(1));
		} catch (e) {
			console.error(e);
			return e;
		};
	}
}
