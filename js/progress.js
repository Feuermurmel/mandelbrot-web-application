Progress = function (onUpdate) {
	var goal = 0;
	var done = 0;
	var offset = 0; // done tiles that aren't count as goal nor as done.
	var isUpdating = false;
	var lastSetGoal = null;
	
	function now() {
		return (new Date()).getTime() / 1000;
	}
	
	function update(p) {
		if (done >= goal)
			isUpdating = false;
		else if (now() - lastSetGoal > 1)
			isUpdating = true;
		
		if (goal != 0 && isUpdating)
			onUpdate((done - offset) / (goal - offset));
		else
			onUpdate(1);
		
		console.log([done, goal, offset])
	}
	
	function changeGoal(v) {
		goal += v;
		lastSetGoal = now();
		
		if (!isUpdating || offset > done)
			offset = done;
		
		update();
	}
	
	// For every call to addGoal(), there must be a call to removeGoal().
	// For every call to addDone(), there must be a call to removeDone().
	return {
		addGoal: function () {
			changeGoal(1);
		},
		removeGoal: function () {
			changeGoal(-1);
		},
		addDone: function () {
			done += 1;
			update();
		},
		removeDone: function () {
			done -= 1;
			update();
		}
	};
};
