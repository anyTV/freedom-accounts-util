'use strict';


module.exports = (grunt) => {

    grunt.initConfig({
        jshint: {
            files: [
                'Gruntfile.js',
                'index.js',
                'test/**/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        mochaTest: {
            test: {
                src: ['test/**/*.js'],
                options: {
                    reporter: 'spec',
                    timeout: 5000
                }
            }
        },

        watch: {
            tests: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint', 'mochaTest'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('test', ['jshint', 'mochaTest']);
    grunt.registerTask('test-watch', ['jshint', 'mochaTest', 'watch:tests']);

};
