mandelbrot = function () {
	tileSize = 256/2; // Pixel size of one tile.
	numLayers = 10; // Number of "level of detail"s.
	
	function cssFunction(name) {
		return name + '(' + util.makeArray(arguments).slice(1).join(', ') + ')'
	}
	
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
	
	function indexValue(ind) {
		return ind.reduce(function (s, v) {
			return s * 2 + v;
		}, 0);
	}
	
	function indexToName(ind) {
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
	
	return function (element) {
		var offset = { "x": 0, "y": 0 }; // Pixel offset of the top left tile relative to the viewer div.
		var index = { "x": [], "y": [] }; // Index of the top left tile.
		var viewerWrapper = $(".wrapper", element);
		var viewerSize = { "x": 0, "y": 0 };
		var tiles = { }; // Map for visible tiles from tile names to HTMLElements.
		var dragStartOffset;
		
		function updateHash() {
			var offsetX = offset.x - viewerSize.x / 2;
			var offsetY = offset.y - viewerSize.y / 2;
			var hash = indexToName({
				"x": indexAdd(index.x, Math.floor(-offsetX / tileSize)),
				"y": indexAdd(index.y, Math.floor(-offsetY / tileSize))
			});
			
			Hash.update(hash);
		};
		
		function updateFromHash(hash) {
			var slice = hash.split("").map(function (v) {
				if ("abcd".indexOf(v) < 0)
					return "";
				else
					return v;
			}).join("");
			
			if (slice == "") {
				index = { "x": [1], "y": [1] };
				setOffset(viewerSize.x / 2, viewerSize.y / 2);
			} else {
				index = indexFromName(slice);
				setOffset(Math.floor((viewerSize.x - tileSize) / 2), Math.floor((viewerSize.y - tileSize) / 2));
			}
		};
		
		function updateSize() {
			viewerSize = {
				"x": $(element).width(),
				"y": $(element).height()
			};
		};
		
		function setOffset(x, y) {
			offset.x = Math.floor(x);
			offset.y = Math.floor(y);
			
			viewerWrapper[0].style.webkitTransform = cssFunction('translate3d', offset.x + 'px', offset.y + 'px', '0px');
		};
		
		function moveOffset(x, y) {
			setOffset(offset.x + x, offset.y + y);
		};
		
		// Adds new tiles and removes those, which aren't visible anymore.
		function updateVisible() {
			// TODO: Check that visible != that.visible.
			var newTiles = { };
			var names = { };
			
			function createLayer(nam, level) {
				var names = { };
				var factor = Math.pow(2, level);
				var conts = [];
				
				$.each(nam, function (k, v) {
					names[k.slice(0, -1)] = {
						"x": "ac".indexOf(k.slice(-1)) < 0 ? v.x - factor : v.x,
						"y": "ab".indexOf(k.slice(-1)) < 0 ? v.y - factor : v.y,
					};
					
					conts.push(function () {
						var img = tiles[k];
						
						if (img == undefined) {
							img = new Image();
							
							$(img).addClass('tile').load(function () {
								$(img).css({ 'opacity': 1 });
							}).attr("src", "mandelbrot.sh/" + k + ".png");
							
							viewerWrapper.append(img);
						} else {
							delete tiles[k];
						}
						
						img.style.webkitTransform = cssFunction('translate3d', v.x * tileSize + 'px', v.y * tileSize + 'px', '0px') + cssFunction('scale3d', factor / 2, factor / 2, 1);
						img.style.zIndex = -level
						
						newTiles[k] = img;
					});
				});
				
				if (level < numLayers - 1)
					createLayer(names, level + 1);
				
				conts.map(function (v) { v(); });
			};
			
			var visible = {
				"xmin": -Math.ceil(offset.x / tileSize),
				"ymin": -Math.ceil(offset.y / tileSize),
				"xmax": Math.ceil((viewerSize.x - offset.x) / tileSize),
				"ymax": Math.ceil((viewerSize.y - offset.y) / tileSize),
			};
			
			for (var iy = visible.ymin; iy < visible.ymax; iy += 1)
				for (var ix = visible.xmin; ix < visible.xmax; ix += 1)
					names[indexToName({
						"x": indexAdd(index.x, ix),
						"y": indexAdd(index.y, iy)
					})] = { "x": ix, "y": iy };
			
			createLayer(names, 0);
			
			lambda.map(tiles, function (k, v) {
				$(v).remove();
			});
			
		/*	$.each(tiles, function () {
				$(this).remove();
			})*/
			
			tiles = newTiles;
		};
		
		// Zooms in by a factor of two around the center of the viewer.
		function zoomIn() {
			var indexOffset = {
				"x": -Math.floor(offset.x / tileSize),
				"y": -Math.floor(offset.y / tileSize)
			};
			
			setOffset((offset.x + indexOffset.x * tileSize) * 2 - viewerSize.x / 2, (offset.y + indexOffset.y * tileSize) * 2 - viewerSize.y / 2);
			
			index.x = indexAdd(index.x, indexOffset.x);
			index.y = indexAdd(index.y, indexOffset.y);
			index.x.push(0);
			index.y.push(0);
		};
		
		// Zooms out by a factor of two around the center of the viewer.
		function zoomOut() {
			var indexOffset = {
				"x": index.x.pop(),
				"y": index.y.pop()
			};
			
			setOffset((offset.x - indexOffset.x * tileSize + viewerSize.x / 2) / 2, (offset.y - indexOffset.y * tileSize + viewerSize.y / 2) / 2);
		};
		
		function registerKeyEvents(element) {
			var timerRunning = false;
			var timerTime = 0;
			var directions = {
				37: { x: 1, y: 0, pressed: false },
				38: { x: 0, y: 1, pressed: false },
				39: { x: -1, y: 0, pressed: false },
				40: { x: 0, y: -1, pressed: false }
			}
			
			function setTimer(lastTime) {
				timerRunning = true;
				$(element).oneTime("50ms", function () {
					var time = (new Date()).getTime();
					var timeDelta = (time - lastTime) / 1000;
					var moveX = 0, moveY = 0;
					var delta = Math.round(120 - 100 / (timerTime + 1));
					
					[37, 38, 39, 40].map(function (v) {
						dir = directions[v];
						
						if (dir.pressed) {
							moveX += dir.x;
							moveY += dir.y;
						}
					});
					
					if (moveX != 0 || moveY != 0) {
						timerTime += timeDelta;
						moveOffset(moveX * delta, moveY * delta);
						setTimer(time);
						updateVisible();
					} else {
						updateHash();
						updateVisible();
						timerRunning = false;
						timerTime = 0;
					}
				});
			}
			
			function handle(evt) {
				dir = directions[evt.which];
				
				if (dir != undefined) {
					dir.pressed = evt.type == "keydown";
					
					if (!timerRunning)
						setTimer((new Date()).getTime());
				}
			}
			
			$(element).keydown(handle).keyup(handle);
		}
		
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
			
			$(element).bind("selectstart", function () {
				return false;
			});
			
			$(element).drag(function () {
				dragStartOffset = {
					"x": offset.x,
					"y": offset.y
				};
			}, function (evt) {
				setOffset(dragStartOffset.x + evt.offsetX, dragStartOffset.y + evt.offsetY);
			}, function (evt) {
				dragStartOffset = null;
				updateVisible();
				updateHash();
			});
			
			registerKeyEvents(window);
			
			Hash.onUpdate(function (hash) {
				updateFromHash(hash);
				updateVisible(true);
				updateHash();
			});
			
			$(element).dblclick(function (evt) {
				var offset = $(this).offset();
				
				moveOffset(viewerSize.x / 2 - (evt.pageX - offset.left), viewerSize.y / 2 - (evt.pageY - offset.top));
				zoomIn();
				updateVisible(true);
				updateHash();
			});
			
			$(".controls", element).dblclick(function (evt) {
				// So "double-clicking" on a control doesen't zoom in.
				evt.stopPropagation();
			});
			
			$(window).resize(function () {
				updateSize();
				updateVisible();
				updateHash();
			})
			
			// initialisation
			updateSize();
			updateFromHash(document.location.hash);
			updateVisible();
		};
		
		init();
	};
} ();
