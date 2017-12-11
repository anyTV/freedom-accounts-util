'use strict';

const _ = require('lodash');

const config = {
    base_url: '',
    path: '',
    client_id: '',
    client_secret: '',
    client_expiry: 300, // in seconds
    server_expiry: 300, // in seconds
    disable_caching: false,
    configure: configure
};

module.exports = config;

function configure (new_config) {
    _.merge(config, new_config);
}
