'use strict';

const cudl = require('cuddle');
const _ = require('lodash');

const config = require('./config');
const cache = require('./cache');

module.exports = {
    generate_token
};

function generate_token (scopes) {
    const scopes_string = _(scopes).sort().sortedUniq().join(' ');
    const cached_token_result = cache.get('client', scopes_string);
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
                cache.set('client', scopes_string, result, config.client_expiry);

                return result;
            });
    }

    return Promise.resolve(cached_token_result);
}
