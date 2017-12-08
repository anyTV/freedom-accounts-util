'use strict';

const _ = require('lodash');

const config = {
    base_url: '',
    path: '',
    client_id: '',
    client_secret: '',
    configure: configure
};

module.exports = config;

function configure (new_config) {
    _.merge(config, new_config);

    if (config.client_expiry === null) {
        config.client_expiry = 300;
    }

    if (config.server_expiry === null) {
        config.server_expiry = 300;
    }
}
