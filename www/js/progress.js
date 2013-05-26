Progress = function (onUpdate) {
	var goals = { }
	var isUpdating = false
	var lastSetGoal = null
	
	function now() {
		return (new Date()).getTime() / 1000
	}
	
	function update(p) {
		var goal = 0
		var done = 0
		
		lambda.map(goals, function (k, v) {
			goal += 1
			done += v
		})
		
		if (done == goal)
			isUpdating = false
		else if (now() - lastSetGoal > 1)
			isUpdating = true
		
		if (goal != 0 && isUpdating)
			onUpdate(done / goal)
		else
			onUpdate(1)
	}
	
	function changedGoals() {
		lastSetGoal = now()
		
		if (!isUpdating) {
			goals = lambda.filter(goals, function (k, v) {
				return !v
			})
		}
		
		update()
	}
	
	// For every call to addGoal(), there must be a call to removeGoal().
	// For every call to addDone(), there must be a call to removeDone().
	return {
		add: function (id) {
			goals[id] = false
			changedGoals()
		},
		remove: function (id) {
			delete goals[id]
			changedGoals()
		},
		done: function (id) {
			goals[id] = true
			update()
		}
	}
}
