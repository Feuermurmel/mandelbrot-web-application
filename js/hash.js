Hash = (function () {
	var onUpdate;
	var timer;
	var lastHash;
	
	return {
		onUpdate: function (fn) {
			onUpdate = fn;
			
			if (timer == null) {
				timer = Timer('.5s', function () {
					if (document.location.hash != lastHash) {
						lastHash = document.location.hash;
						onUpdate(lastHash.slice(1));
					};
				});
			}
		},
		update: function (args) {
			lastHash = '#' + args;
			document.location.hash = lastHash;
		}
	};
}) ();
