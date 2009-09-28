object = function (obj) {
	function F() {}
	F.prototype = obj;
	return new F();
};

sign = function (num) {
	if (num > 0)
		return 1;
	else if (num < 0)
		return -1;
	else
		return 0;
}

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

/* dir: 0: left, 1: right, 2: up, 3: down */
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
