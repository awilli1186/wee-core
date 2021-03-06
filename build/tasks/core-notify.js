module.exports = function(grunt) {
	grunt.registerTask('notify', function(task) {
		var obj = {};

		if (task === 'project') {
			obj.title = 'Project Updated';
			obj.message = 'Config updated successfully';
		} else if (task === 'images') {
			obj.title = 'Images Minified';
			obj.message = 'Images minified successfully';
		} else if (task === 'script') {
			obj.title = 'Script Compiled';
			obj.message = 'JavaScript compiled successfully';
		} else if (task === 'style') {
			obj.title = 'Style Compiled';
			obj.message = 'CSS compiled successfully';
		} else if (task === 'fonts') {
			obj.title = 'Fonts Synced';
			obj.message = 'Fonts synced successfully';
		}

		Wee.notify(obj);
	});
};