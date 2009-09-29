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
	return round(num - Math.floor(num / div) * div);
}

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
		// ind = object(ind); ***leakage
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
	
	function indexToString(ind) {
		return ind.map(function (v) {
			return ["0", "1"][v];
		}).join("");
	}
	
//	console.log(indexAdd([0, 0, 0], 2));
//	console.log(indexToString([1, 0, 1]));
	
	module.create = function (elem) {
		var object = { };
		var that = { };
		
		that.visible = { "xmin": 0, "ymin": 0, "xmax": 0, "ymax": 0 }; // Number of visible tiles in each direction relative to the index.
		that.offset = { "x": 0, "y": 0 }; // Pixel offset of the top left tile relative to the viewer div.
		that.index = { "x": [0, 0, 0, 0, 0, 0], "y": [0, 0, 0, 0, 0, 0] }; // Index of the top left tile.
		that.viewer = elem;
		that.tiles = { }; // Map for visible tiles from tile names to HTMLElements.
		that.object = object; // self
		
		$(that.viewer).addClass("mandelbrot");
		$(that.viewer).append(document.createElement("div"));
		
		// Adds new tiles and removes those, which aren't visible anymore.
		function updateVisible() {
			var visible = {
				"xmin": -Math.ceil(that.offset.x / tileSize),
				"ymin": -Math.ceil(that.offset.y / tileSize),
				"xmax": Math.ceil(($(that.viewer).width() - that.offset.x) / tileSize),
				"ymax": Math.ceil(($(that.viewer).height() - that.offset.y) / tileSize),
			};
			
			// TODO: Check that visible != that.visible
			var xmin = Math.min(that.visible.xmin, visible.xmin);
			var ymin = Math.min(that.visible.ymin, visible.ymin);
			var xmax = Math.max(that.visible.xmax, visible.xmax);
			var ymax = Math.max(that.visible.ymax, visible.ymax);
			
			console.log([xmin, ymin, xmax, ymax]);
			
			for (var iy = ymin; iy < ymax; iy += 1) {
				for (var ix = xmin; ix < xmax; ix += 1) {
					var before = that.visible.xmin <= ix && ix < that.visible.xmax && that.visible.ymin <= iy && iy < that.visible.ymax;
					var after = visible.xmin <= ix && ix < visible.xmax && visible.ymin <= iy && iy < visible.ymax;
					
					if (before != after) {
						// TODO: Some magic needed here to check wether we're outside of the fractal.
						var name = indexName({
							"x": indexAdd(that.index.x, ix),
							"y": indexAdd(that.index.y, iy)
						});
						
						if (before) {
							$(that.tiles[name]).remove();
							delete that.tiles[name];
							
							console.log("removed: " + name);
						} else if (after) {
							var img = $(new Image());
							
							img.css({
								"left": ix * tileSize,
								"top": iy * tileSize,
								"width": tileSize,
								"height": tileSize,
								"opacity": 0
							});
							img.load(function () {
							//	$(this).css({ "opacity": 1 });
								$(this).animate({ "opacity": 1 }, 400);
							});
							img.attr("src", "mandelbrot.sh/" + name + ".png");
							$(that.viewer).children().append(img);
							that.tiles[name] = img;
							
							console.log("added: " + name);
						}
					}
				};
			};
			
			that.visible = visible;
		};
		
		// Should be called when the size of the viewer has chanegd.
		object.resized = function () {
			updateVisible();
		};
		
		// Moves the content of the vievert by the amount in pixels.
		object.move = function (x, y) {
		
		};
		
		$(that.viewer).disableTextSelect();
		$(that.viewer).drag(function () { }, function (evt) {
			console.log([evt.offsetX, evt.offsetY]);
			$(that.viewer).children().css({
				left: that.offset.x + evt.offsetX,
				top: that.offset.y + evt.offsetY
			});
		}, function (evt) {
			that.offset.x += evt.offsetX;
			that.offset.y += evt.offsetY;
			updateVisible();
		});
		
		updateVisible();
		
		return object;
	};
	
	return module;
} ();
