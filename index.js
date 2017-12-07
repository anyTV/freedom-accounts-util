'use strict';

const cudl = require('cuddle');
const moment = require('moment');
const _ = require('lodash');

module.exports = {
    configure,
    generate_token,
    clear_server_cache,
    clear_client_cache,
    clear_cache
};

let cache = {
    server: {},
    client: {}
};

const config = {
    base_url: '',
    path: '',
    client_id: '',
    client_secret: ''
};

function _cache_get(category, key, fallback = null) {
    const cache_record = cache[category][key];

    if(cache_record) {
        if(!moment(cache_record.expiration).isBefore(moment())) {
            return cache_record.value;
        }

        delete cache[category][key];
    }

    return fallback;
}

function _cache_set(category, key, value, expiry) {
    cache[category][key] = {
        expiration: moment().add(expiry, 'seconds'),
        value: value
    };
}

function configure (new_config) {
    _.merge(config, new_config);

    if(config.client_expiry === null) {
        config.client_expiry = 600;
    }

    if(config.server_expiry === null) {
        config.server_expiry = 600;
    }
}

function generate_token (scopes) {
    const scopes_string = _(scopes).sort().sortedUniq().join(' ');
    const cached_token_result = _cache_get('client', scopes_string);
    const payload = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        grant_type: 'client_credentials',
        scopes: scopes_string
    };

    if (!cached_token_result) {
        return cudl.post
            .to(config.base_url + config.path + '/oauth/token')
            .send(payload)
            .promise()
            .then(result => {
                _cache_set('client', scopes_string, result, config.client_expiry);

                return result;
            });
    }

    return Promise.resolve(cached_token_result);
}

function clear_server_cache () {
    cache.server = {};
}

function clear_client_cache () {
    cache.client = {};
}

function clear_cache () {
    clear_server_cache();
    clear_client_cache();
}
