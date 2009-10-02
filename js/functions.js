function object(obj) {
	function F() {}
	F.prototype = obj;
	return new F();
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

Mandelbrot2 = function () {
	var module = { };
	
	tileSize = 256/2; // Pixel size of one tile.
	
	function indexFixup(ind) {
		var last = ind.pop();
		
		if (last != 0 && last != 1 && ind.length > 0) {
			ind[ind.length - 1] += Math.floor(last / 2);
			ind = indexFixup(ind);
		}
		
		ind.push(Math.abs(last % 2));
		
		return ind;
	}
	
	function indexAdd(ind, num) {
		ind = ind.map(function (v) { return v; });
		
		if (ind.length > 0) {
			ind[ind.length - 1] += num;
			return indexFixup(ind);
		} else {
			return ind;
		}
	};
	
	function indexName(ind) {
		var replace = [["a", "b"], ["c", "d"]]
		var path = "";
		
		for (var i = 0; i < ind.x.length; i += 1)
			path += replace[ind.y[i]][ind.x[i]];
		
		return path;
	}
	
	function indexFromName(name) {
		var replace = { "a": [0, 0], "b": [1, 0], "c": [0, 1], "d": [1, 1] };
		var index = { "x": [], "y": [] };
		
		name.split("").map(function (v) {
			index.x.push(replace[v][0]);
			index.y.push(replace[v][1]);
		});
		
		return index;
	}
	
	function indexToString(ind) {
		return ind.map(function (v) {
			return ["0", "1"][v];
		}).join("");
	}
	
	function indexToNumber(ind) {
		function f(i) {
			if (i == 0) {
				return 0;
			} else {
				return ind[i - 1] + f(i - 1) * 2;
			}
		}
		
		return f(ind.length);
	}
	
//	log(indexToNumber([0, 0, 0, 1]));
//	log(indexToNumber([0, 0, 1, 0]));
//	log(indexToNumber([0, 1, 0, 0]));
//	log(indexToNumber([1, 0, 0, 0]));
	
//	log(indexAdd([0, 0, 0], 2));
//	log(indexToString([1, 0, 1]));
	
	module.create = function (element) {
		var object = { };
		
		// create dom elements
		$(element).append([
			createElement("div", { "class": "mandelbrot" }, [
				createElement("div", { "class": "wrapper" }),
				createElement("div", { "class": "controls" }, [
					createElement("div", { "class": "minus" }),
					createElement("div", { "class": "plus" })
				])
			])
		]);
		
		var that = {
			"visible": { "xmin": 0, "ymin": 0, "xmax": 0, "ymax": 0 }, // Number of visible tiles in each direction relative to the index.
			"offset": { "x": 0, "y": 0 }, // Pixel offset of the top left tile relative to the viewer div.
			"index": { "x": [0, 0, 0, 0], "y": [0, 0, 0, 0] }, // Index of the top left tile.
			"viewer": {
				"wrapper": $(".wrapper", element)[0],
				"size": { "x": 0, "y": 0 }
			},
			"tiles": { }, // Map for visible tiles from tile names to HTMLElements.
			"object": object, // self
			"lastHash": ""
		};
		
		function updateHash() {
			var offset = {
				"x": that.offset.x - that.viewer.size.x / 2,
				"y": that.offset.y - that.viewer.size.y / 2
			};
			
			document.location.hash = "#" + indexName({
				"x": indexAdd(that.index.x, Math.floor(-offset.x / tileSize)),
				"y": indexAdd(that.index.y, Math.floor(-offset.y / tileSize))
			});
			that.lastHash = document.location.hash;
		};
		
		function centerHash(name) {
			that.index = indexFromName(name);
			setOffset(Math.floor((that.viewer.size.x - tileSize) / 2), Math.floor((that.viewer.size.y - tileSize) / 2));
		};
		
		centerHashTest = function (hash) {
			log([that.index.x, that.index.y, that.offset.x, that.offset.y]);
			centerHash(hash);
			log([that.index.x, that.index.y, that.offset.x, that.offset.y]);
			
			updateVisible(true);
			updateHash();
		};
		
		function setOffset(x, y) {
			that.offset.x = Math.floor(x);
			that.offset.y = Math.floor(y);
			
			$(that.viewer.wrapper).css({
				"left": that.offset.x,
				"top": that.offset.y
			});
		};
		
		function moveOffset(x, y) {
			setOffset(that.offset.x + x, that.offset.y + y);
		};
		
		// Adds new tiles and removes those, which aren't visible anymore.
		function updateVisible(clear) {
			// TODO: Check that visible != that.visible.
			function tileName(ix, iy) {
				return indexName({
					"x": indexAdd(that.index.x, ix),
					"y": indexAdd(that.index.y, iy)
				});
			};
			
			function removeTile(ix, iy) {
				var name = tileName(ix, iy);
				
				$(that.tiles[name]).remove();
				delete that.tiles[name];
			};
			
			function createTile(ix, iy) {
				var img = $(new Image());
				var name = tileName(ix, iy);
				
				img.css({
					"left": ix * tileSize,
					"top": iy * tileSize,
					"width": tileSize,
					"height": tileSize,
					"opacity": 0
				}).load(function () {
				//	$(this).css({ "opacity": 1 });
					$(this).animate({ "opacity": 1 }, 400);
				}).attr("src", "mandelbrot.sh/" + name + ".png");
				$(that.viewer.wrapper).append(img);
				that.tiles[name] = img;
			};
			
			var visible = {
				"xmin": -Math.ceil(that.offset.x / tileSize),
				"ymin": -Math.ceil(that.offset.y / tileSize),
				"xmax": Math.ceil((that.viewer.size.x - that.offset.x) / tileSize),
				"ymax": Math.ceil((that.viewer.size.y - that.offset.y) / tileSize),
			};
			
			if (clear) {
				// Clear all tiles and recreate everything.
				$(that.viewer.wrapper).empty();
				that.tiles = [];
				
				for (var iy = visible.ymin; iy < visible.ymax; iy += 1)
					for (var ix = visible.xmin; ix < visible.xmax; ix += 1)
						createTile(ix, iy);
			} else {
				var xmin = Math.min(that.visible.xmin, visible.xmin);
				var ymin = Math.min(that.visible.ymin, visible.ymin);
				var xmax = Math.max(that.visible.xmax, visible.xmax);
				var ymax = Math.max(that.visible.ymax, visible.ymax);
				
				for (var iy = ymin; iy < ymax; iy += 1) {
					for (var ix = xmin; ix < xmax; ix += 1) {
						var before = that.visible.xmin <= ix && ix < that.visible.xmax && that.visible.ymin <= iy && iy < that.visible.ymax;
						var after = visible.xmin <= ix && ix < visible.xmax && visible.ymin <= iy && iy < visible.ymax;
						
						if (before && !after)
							removeTile(ix, iy);
						else if (!before && after)
							createTile(ix, iy);
					};
				};
			}
			
			that.visible = visible;
		};
		
		// This should be called, whenever the viewer div changed it's size.
		object.resized = function () {
			that.viewer.size = {
				"x": $(element).width(),
				"y": $(element).height()
			};
			
			updateVisible();
			updateHash();
		};
		
		// Moves the content of the viewer by the amount in pixels.
		object.move = function (x, y) {
		};
		
		// Zooms in by a factor of two around the origin of the viewer.
		function zoomIn() {
			var indexOffset = {
				"x": -Math.floor(that.offset.x / tileSize),
				"y": -Math.floor(that.offset.y / tileSize)
			};
			
			setOffset((that.offset.x + indexOffset.x * tileSize) * 2, (that.offset.y + indexOffset.y * tileSize) * 2);
			
			that.index.x = indexAdd(that.index.x, indexOffset.x);
			that.index.y = indexAdd(that.index.y, indexOffset.y);
			that.index.x.push(0);
			that.index.y.push(0);
		};
		
		// Zooms out by a factor of two around the origin of the viewer.
		function zoomOut() {
			var indexOffset = {
				"x": that.index.x.pop(),
				"y": that.index.y.pop()
			};
			
			setOffset((that.offset.x - indexOffset.x * tileSize) / 2, (that.offset.y - indexOffset.y * tileSize) / 2);
		};
		
		// Zooms in on positive aguments and out on negative arguments.
		object.zoom = function (dir) {
			if (dir > 0) {
				zoomIn();
				moveOffset(-that.viewer.size.x / 2, -that.viewer.size.y / 2);
			} else if (dir < 0) {
				moveOffset(that.viewer.size.x / 2, that.viewer.size.y / 2);
				zoomOut();
			}
			
			updateVisible(true);
			updateHash();
		};
		
		// setup
		$(".plus", element).click(function () { object.zoom(1); });
		$(".minus", element).click(function () { object.zoom(-1); });
		
		$(element).disableTextSelect();
		$(".mandelbrot", element).drag(function () {
			that.dragStartOffset = {
				"x": that.offset.x,
				"y": that.offset.y
			};
		}, function (evt) {
			setOffset(that.dragStartOffset.x + evt.offsetX, that.dragStartOffset.y + evt.offsetY);
		}, function (evt) {
			delete that.dragStartOffset;
			updateVisible();
			updateHash();
		});
		
		$(document).everyTime("1s", function () {
			if (document.location.hash != that.lastHash) {
				// TODO: Input validation needed here!!!
				log(document.location.hash);
				centerHash(document.location.hash.slice(1));
				updateVisible(true);
				updateHash();
			}
		});
		
		$(".mandelbrot", element).dblclick(function (evt) {
			var offset = $(".mandelbrot", element).offset();
			
			log([that.viewer.size.x / 2 - (evt.pageX - offset.left), that.viewer.size.y / 2 - (evt.pageY - offset.top)]);
			moveOffset(that.viewer.size.x / 2 - (evt.pageX - offset.left), that.viewer.size.y / 2 - (evt.pageY - offset.top));
			object.zoom(1);
		});
		
		$(".controls", element).dblclick(function (evt) {
			// So "double-clicking" on a control doesen't zoom in.
			evt.stopPropagation();
		});
		
		// initialisation
		object.resized();
		updateVisible();
		updateHash();
		
		return object;
	};
	
	return module;
} ();
