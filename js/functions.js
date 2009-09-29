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

Mandelbrot2 = function () {
	var module = { };
	
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
		ind = object(ind);
		
		if (ind.length > 0) {
			ind[ind.length - 1] += num;
			return indexFixup(ind);
		} else {
			return ind;
		}
	};
	
	function indexToPath(ind) {
		var replace = [["a", "b"], ["c", "d"]]
		var path = "";
		
		for (var i = 0; i < ind.x.length; i += 1)
			path += replace[ind.y[i]][ind.x[i]];
		
		return path;
	}
	
//	console.log(indexAdd([0, 0, 0], 2));
	
	module.create = function (elem) {
		var object = { };
		var that = { };
		
		that.tileSize = 256; // Pixel size of one tile.
	//	that.visible = { "x": 0, "y": 0 }; // Number of visible tiles.
		that.offset = { "x": 0, "y": 0 }; // Pixel offset of the top left tile relative to the viewer div.
		that.element = elem; // The viewer div.
		that.index = { "x": [0, 0], "y": [0, 0] }; // Index of the top left tile.
		that.object = object;
		
		$(that.element).addClass("mandelbrot");
		
		object.update = function () {
			var visible = {
				"x": Math.ceil($(that.element).width() / that.tileSize),
				"y": Math.ceil($(that.element).height() / that.tileSize)
			}
			var elems = $("img", that.element);
			
			for (var iy = 0; iy < visible.y; iy += 1) {
				for (var ix = 0; ix < visible.x; ix += 1) {
					var img = $(new Image());
					var path = indexToPath({
						"x": indexAdd(that.index.x, ix),
						"y": indexAdd(that.index.y, iy)
					});
					
					var id = "mandelbrot_" + path;
					var elem = $("#" + id, that.element)[0];
					
					if (elem) {
						elems = elems.not(elem);
					} else {
						img.css({
							"left": ix * that.tileSize,
							"top": iy * that.tileSize,
							"width": that.tileSize,
							"height": that.tileSize
						});
						img.attr("src", "mandelbrot.sh/" + path + ".png");
						img.attr("id", id);
						$(that.element).append(img);
						console.log("created tile: " + id);
					}
				};
			};
			
			elems.remove();
		};
		
		$(elem).disableTextSelect();
		object.update();
		
		return object;
	};
	
	return module;
} ();


Mandelbrot = {};

Mandelbrot.position = { x:"0", y:"0" };

Mandelbrot.movePos = function (pos, dir) {
	var replace;
	
	if (typeof dir == "number") {
		while (dir != 0) {
			pos = this.movePos(pos, dir < 0);
			dir -= sign(dir);
		}
	} else {
		if (dir)
			replace = [1, 0];
		else
			replace = [0, 1];
		
		var p = pos.lastIndexOf(replace[0]);
		
		if (p > -1)
			pos = pos.slice(0, p) + replace[1] + pos.slice(p + 1).replace(RegExp(replace[1], "g"), replace[0]);
	}
	
	return pos;
};

Mandelbrot.move = function (x, y) {
	this.position = {
		"x":this.movePos(this.position.x, x),
		"y":this.movePos(this.position.y, y)
	};
	this.updateImages();
}

Mandelbrot.zoomPos = function (pos, x, y) {
	return {
		"x":this.movePos(pos.x + "0", x),
		"y":this.movePos(pos.y + "0", y)
	};
}

Mandelbrot.zoom = function (x, y) {
	this.position = this.zoomPos(this.position, x, y);
	this.updateImages();
}

Mandelbrot.zoomOut = function () {
	this.position = {
		"x":this.position.x.slice(0, -1),
		"y":this.position.y.slice(0, -1)
	};
	this.updateImages();
}

Mandelbrot.toPath = function (pos) {
	var replace = {
		"0":{ "0":"a", "1":"b" },
		"1":{ "0":"c", "1":"d" }
	}
	var path = "";
	
	for (var i = 0; i < pos.x.length; i += 1)
		path += replace[pos.y.charAt(i)][pos.x.charAt(i)];
	
	return "mandelbrot.sh/" + path + ".png";
};

Mandelbrot.updateImages = function (pos) {
	var that = this;
	
	if (! pos)
		pos = this.position;
	
	$("img[id]").each(function () {
		var pos2 = object(pos);
		var s = $(this).attr("id");
		var first = true;
		
		for (var i in s.split("")) {
			var si = s[i];
			
			if (first) {
				first = false;
			} else {
				pos2.x = pos2.x + "0";
				pos2.y = pos2.y + "0";
			}
			
			if (si == "b" || si == "d")
				pos2.x = that.movePos(pos2.x)
			
			if (si == "c" || si == "d")
				pos2.y = that.movePos(pos2.y)
		}
		
		$(this).attr("src_", that.toPath(pos2));
	})
	
	$("img.big").load(function() {
		$(this).removeAttr("src_").show();
		$("img[id^=" + $(this).attr("id") + "].small").each(function () {
			$(this).attr("src", $(this).attr("src_")).show();
		});
	}).each(function () {
		$(this).attr("src", $(this).attr("src_"));
	});
	
	$("img.small").hide()
	
	setTimeout(function () {
		$("img.big").each(function () {
			if ($(this).attr("src_"))
				$(this).hide()
		})
	}, 100)
};
