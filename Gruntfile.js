


module.exports = (grunt) => {

    grunt.initConfig({
        eslint: {
            src: [
                'Gruntfile.js',
                'index.js',
                'test/**/*.js'
            ],
            options: {
                configFile: '.eslintrc'
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
                files: ['<%= eslint.src %>'],
                tasks: ['eslint', 'mochaTest'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks('gruntify-eslint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('test', ['eslint', 'mochaTest']);
    grunt.registerTask('test-watch', ['eslint', 'mochaTest', 'watch:tests']);

};
