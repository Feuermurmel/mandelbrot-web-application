function object(obj) {
	function f() {}
	f.prototype = obj;
	return new f();
};

function sign(num) {
	if (num > 0)
		return 1;
	else if (num < 0)
		return -1;
	else
		return 0;
};

function modulo(num, div) {
	return num - Math.floor(num / div) * div;
}

log = function () {
	if (typeof console == 'undefined')
		return function (msg) { };
	else
		return function (msg) {
			console.log(msg);
		};
} ();

function getSearchArgs() {
	var parts = document.location.search.slice(1).split("&");
	var result = { };
	
	$.each(parts, function () {
		var pair = this.split("=");
		
		if (pair.length == 1)
			result[pair[0]] = true;
		else
			result[pair[0]] = pair.slice(1).join("=");
	})
	
	return result;
};

function createElement(tag, attrs, contents) {
	var elem = $(document.createElement(tag));
	
	if (attrs)
		elem.attr(attrs);
	
	if (contents)
		$.each(contents, function () {
			elem.append($(this).clone());
		});
	
	return elem[0];
}
