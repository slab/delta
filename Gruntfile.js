module.exports = function(grunt) {
  // Define to control testing order
  var tests = [
    'test/is.js',
  ];

  grunt.registerTask('coverage', function() {
    grunt.util.spawn({
      cmd: './node_modules/.bin/istanbul',
      args: ['cover', './node_modules/.bin/_mocha'].concat(tests).concat(['--dir', '.coverage']),
      opts: { stdio: 'inherit' }
    }, this.async());
  });

  grunt.registerTask('test', function() {
    grunt.util.spawn({
      cmd: './node_modules/.bin/mocha',
      args: tests,
      opts: { stdio: 'inherit' }
    }, this.async());
  });
};
