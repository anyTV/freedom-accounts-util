'use strict';

const cudl = require('cuddle');
const moment = require('moment');
const _ = require('lodash');

module.exports = {
    configure,
    verify_scopes,
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

function _cache_get (category, key, fallback = null) {
    const cache_record = cache[category][key];

    if (cache_record) {
        if (!moment(cache_record.expiration).isBefore(moment())) {
            return cache_record.value;
        }

        delete cache[category][key];
    }

    return fallback;
}

function _cache_set (category, key, value, expiry) {
    cache[category][key] = {
        expiration: moment().add(expiry, 'seconds'),
        value: value
    };
}

function configure (new_config) {
    _.merge(config, new_config);

    if (config.client_expiry === null) {
        config.client_expiry = 600;
    }

    if (config.server_expiry === null) {
        config.server_expiry = 600;
    }
}

function verify_scopes (required_scopes) {
    return (req, res, next) => {
        return check_scopes(req, required_scopes)
            .then(result => {
                req.client_id = result.client_id;
                next();
            })
            .catch(error => next(error));
    };
}

function check_scopes (request, required_scopes) {
    return check_input(request.headers['access-token'])
        .then(get_token_info)
        .then(result => ({result, required_scopes}))
        .then(check_token_validity);
}

function check_input (access_token) {
    return new Promise((accept, reject) => {
        if (!access_token) {
            return reject(new Error('Access token is missing.'));
        }

        accept(access_token);
    });
}

function get_token_info (access_token) {
    const cached_token_info_result = _cache_get('client', access_token);

    if (!cached_token_info_result) {
        return cudl.get
            .to(config.base_url + config.path + '/oauth/tokeninfo')
            .send({access_token: access_token})
            .promise()
            .then(result => {
                _cache_set('server', access_token, result, config.server_expiry);

                return result;
            });
    }

    return Promise.resolve(cached_token_info_result);
}

function check_token_validity ({result, required_scopes}) {
    return new Promise((resolve, reject) => {
        if (!result.scopes) {
            return reject(new Error('Something went wrong, server did not return scopes, please try again.'));
        }

        const result_scopes = result.scopes.split(' ');
        const has_valid_scopes = _.find(required_scopes, scope => _.includes(result_scopes, scope));

        if (has_valid_scopes) {
            return resolve(result);
        }

        reject(new Error(
            `You need at least one of the ff. scopes to access this endpoint: ${required_scopes.join(', ')}`
        ));
    });
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
