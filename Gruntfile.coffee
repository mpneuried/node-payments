module.exports = (grunt) ->

	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')
		regarde:
			serverjs:
				files: ["_src/**/*.coffee"]
				tasks: [ "coffee:changed", "includereplace" ]
			
		coffee:
			changed:
				expand: true
				cwd: '_src'
				src:	[ '<% print( _.first( ((typeof grunt !== "undefined" && grunt !== null ? (_ref = grunt.regarde) != null ? _ref.changed : void 0 : void 0) || ["_src/nothing"]) ).slice( "_src/".length ) ) %>' ]
				# template to cut off `_src/` and throw on error on non-regrade call
				# CF: `_.first( grunt?.regarde?.changed or [ "_src/nothing" ] ).slice( "_src/".length )
				dest: ''
				ext: '.js'


			base:
				expand: true
				cwd: '_src',
				src: ["**/*.coffee"]
				dest: ''
				ext: '.js'


		mochacli:
			options:
				require: [ "should" ]
				reporter: "spec"
				bail: true
				timeout: 5000
				slow: 10
				env: 
					debug: ""

			main: [ "test/main.js" ]

		includereplace:
			pckg:
				options:
					globals:
						version: "<%= pkg.version %>"

					prefix: "@@"
					suffix: ''

				files:
					"": ["index.js"]

	# Load npm modules
	grunt.loadNpmTasks "grunt-regarde"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	grunt.loadNpmTasks "grunt-include-replace"
	grunt.loadNpmTasks "grunt-mocha-cli"


	# just a hack until this issue has been fixed: https://github.com/yeoman/grunt-regarde/issues/3
	grunt.option('force', not grunt.option('force'))
	
	# ALIAS TASKS
	grunt.registerTask "watch", "regarde"
	grunt.registerTask "default", "build"
	grunt.registerTask "test", [ "mochacli:main" ]

	# build the project
	grunt.registerTask "build", [ "coffee", "includereplace" ]