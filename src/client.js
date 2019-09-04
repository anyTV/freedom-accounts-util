

const cudl = require('cuddle');
const _ = require('lodash');

const config = require('./config');
const cache = require('./cache');

module.exports = {
    generate_token,
    refresh_token,
    revoke_token,
    remove_cache_only,
};

function generate_token (scopes) {
    const scopes_string = _(scopes).sort().sortedUniq().join(' ');
    const cached_token_result = cache.get('client', scopes_string);

    if (cached_token_result) {
        console.log('CACHED TOKEN', cached_token_result);
        return Promise.resolve(cached_token_result);
    }

    const payload = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        grant_type: 'client_credentials',
        scopes: scopes_string
    };

    return cudl.post
        .to(config.base_url + config.path + '/oauth/token')
        .send(payload)
        .max_retry(config.retry_count)
        .promise()
        .then(result => {
            cache.set('client', scopes_string, result, config.client_expiry);

            return result;
        });
}

function refresh_token (_refresh_token) {
    const scopes_string = cache.find_key('client', {_refresh_token});
    const payload = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        grant_type: 'refresh_token',
        refresh_token: _refresh_token
    };

    return cudl.post
        .to(config.base_url + config.path + '/oauth/token')
        .send(payload)
        .max_retry(config.retry_count)
        .promise()
        .then(result => {
            if (scopes_string) {
                cache.set('client', scopes_string, result, config.client_expiry);
            }

            return result;
        });
}

function revoke_token (
    token,
    client_id,
    type = '',
    category = 'server'
) {
    const payload = {
        client_id,
        type
    };
    const access_token = `Bearer ${token}`;

    return Promise.resolve(remove_cache_only('', token, category))
        .then(() => {
            cudl.post
                .to(config.base_url + config.path + '/oauth/revoke')
                .set_header('Authorization', access_token)
                .send(payload)
                .max_retry(config.retry_count)
                .promise();
        });
}

function remove_cache_only (res, token, category = 'client',) {
    const _cache = cache.get(category, token);

    if (_cache) {
        cache.forget(category, token);
    }

    return res;
}
