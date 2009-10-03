Mandelbrot = function () {
	var module = { };
	
	tileSize = 256; // Pixel size of one tile.
	numLayers = 2; // Number of "level of detail"s.
	
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
	
	module.create = function (element) {
		var that = {
			"visible": { "xmin": 0, "ymin": 0, "xmax": 0, "ymax": 0 }, // Number of visible tiles in each direction relative to the index.
			"offset": { "x": 0, "y": 0 }, // Pixel offset of the top left tile relative to the viewer div.
			"index": { "x": [], "y": [] }, // Index of the top left tile.
			"viewer": {
				"wrapper": $(".wrapper", element),
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
		
		function updateFromHash() {
			that.lastHash = document.location.hash;
			var slice = document.location.hash.split("").map(function (v) {
				if ("abcd".indexOf(v) < 0)
					return "";
				else
					return v;
			}).join("");
			
			if (slice == "") {
				that.index = { "x": [1], "y": [1] };
				setOffset(that.viewer.size.x / 2, that.viewer.size.y / 2);
			} else {
				that.index = indexFromName(slice);
				setOffset(Math.floor((that.viewer.size.x - tileSize) / 2), Math.floor((that.viewer.size.y - tileSize) / 2));
			}
		};
		
		function updateSize() {
			that.viewer.size = {
				"x": $(element).width(),
				"y": $(element).height()
			};
		};
		
		function setOffset(x, y) {
			that.offset.x = Math.floor(x);
			that.offset.y = Math.floor(y);
			
			that.viewer.wrapper.css({
				"left": that.offset.x,
				"top": that.offset.y
			});
		};
		
		function moveOffset(x, y) {
			setOffset(that.offset.x + x, that.offset.y + y);
		};
		
		// Adds new tiles and removes those, which aren't visible anymore.
		function updateVisible() {
			// TODO: Check that visible != that.visible.
			var tiles = { };
			var names = { };
			
			function createTile(name, pos, size, lvl) {
				var img = that.tiles[name];
				
				if (img == undefined) {
					img = new Image();
					
					$(img).css("opacity", 0).load(function () {
						$(this).animate({ "opacity": .5 }, 400);
					}).attr("src", "mandelbrot.sh/" + name + ".png");
					
					that.viewer.wrapper.append(img);
				} else {
					delete that.tiles[name];
				}
				
				$(img).css({
					"left": pos.x,
					"top": pos.y,
					"width": size,
					"height": size,
					"z-index": -lvl
				});
				
				tiles[name] = img;
			};
			
			function createLayer(nam, level) {
				var names = { };
				var factor = Math.pow(2, level);
				var offset = {
					"x": that.index.x[that.index.x.length - level - 1],
					"y": that.index.y[that.index.y.length - level - 1]
				};
				
				console.log([offset.x, offset.y]);
				
				$.each(nam, function (k, v) {
					createTile(k, {
						"x": v.x * tileSize,
						"y": v.y * tileSize
					}, factor * tileSize, level);
					
					names[k.slice(0, -1)] = {
						"x": Math.floor((v.x - offset.x) / 2) * 2 + offset.x,
						"y": Math.floor((v.y - offset.y) / 2) * 2 + offset.y
					};
					
				//	console.log([k, v.x, v.y])
					console.log([
						k,
						v.x,
						v.y,
						k.slice(0, -1),
						names[k.slice(0, -1)].x,
						names[k.slice(0, -1)].y
					]);
				});
				
				if (level < numLayers - 1)
					createLayer(names, level + 1);
			};
			
			var visible = {
				"xmin": -Math.ceil(that.offset.x / tileSize),
				"ymin": -Math.ceil(that.offset.y / tileSize),
				"xmax": Math.ceil((that.viewer.size.x - that.offset.x) / tileSize),
				"ymax": Math.ceil((that.viewer.size.y - that.offset.y) / tileSize),
			};
			
			for (var iy = visible.ymin; iy < visible.ymax; iy += 1)
				for (var ix = visible.xmin; ix < visible.xmax; ix += 1)
					names[indexName({
						"x": indexAdd(that.index.x, ix),
						"y": indexAdd(that.index.y, iy)
					})] = { "x": ix, "y": iy };
			
			createLayer(names, 0, { "x": 0, "y": 0 })
				
			$.each(that.tiles, function () {
				$(this).remove();
			})
			
			that.visible = visible;
			that.tiles = tiles;
		};
		
		// Zooms in by a factor of two around the center of the viewer.
		function zoomIn() {
			var indexOffset = {
				"x": -Math.floor(that.offset.x / tileSize),
				"y": -Math.floor(that.offset.y / tileSize)
			};
			
			setOffset((that.offset.x + indexOffset.x * tileSize) * 2 - that.viewer.size.x / 2, (that.offset.y + indexOffset.y * tileSize) * 2 - that.viewer.size.y / 2);
			
			that.index.x = indexAdd(that.index.x, indexOffset.x);
			that.index.y = indexAdd(that.index.y, indexOffset.y);
			that.index.x.push(0);
			that.index.y.push(0);
		};
		
		// Zooms out by a factor of two around the center of the viewer.
		function zoomOut() {
			var indexOffset = {
				"x": that.index.x.pop(),
				"y": that.index.y.pop()
			};
			
			setOffset((that.offset.x - indexOffset.x * tileSize + that.viewer.size.x / 2) / 2, (that.offset.y - indexOffset.y * tileSize + that.viewer.size.y / 2) / 2);
		};
		
		function init() {
			// setup
			$(".plus div", element).click(function () {
				zoomIn();
				updateVisible(true);
				updateHash();
			});
			$(".minus div", element).click(function () {
				zoomOut();
				updateVisible(true);
				updateHash();
			});
			
			$(element).disableTextSelect().drag(function () {
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
			
			$(document).everyTime("500ms", function () {
				if (document.location.hash != that.lastHash) {
					updateFromHash();
					updateVisible(true);
					updateHash();
				}
			});
			
			$(element).dblclick(function (evt) {
				var offset = $(this).offset();
				
				moveOffset(that.viewer.size.x / 2 - (evt.pageX - offset.left), that.viewer.size.y / 2 - (evt.pageY - offset.top));
				zoomIn();
				updateVisible(true);
				updateHash();
			});
			
			$(".controls", element).dblclick(function (evt) {
				// So "double-clicking" on a control doesen't zoom in.
				evt.stopPropagation();
			});
			
			$(document).everyTime("500ms", function () {
				if (document.location.hash != that.lastHash) {
					updateFromHash();
					updateVisible(true);
					updateHash();
				}
			});
			
			$(window).resize(function () {
				updateSize();
				updateVisible();
				updateHash();
			})
			
			// initialisation
			updateSize();
			updateFromHash();
			updateVisible();
		};
		
		init();
	};
	
	return module;
} ();
