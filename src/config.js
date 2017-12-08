'use strict';

const _ = require('lodash');

const config = {
    base_url: '',
    path: '',
    client_id: '',
    client_secret: '',
    client_expiry: 300,
    server_expiry: 300,
    configure: configure
};

module.exports = config;

function configure (new_config) {
    _.merge(config, new_config);
}
