'use strict';

const cudl = require('cuddle');
const _ = require('lodash');

const config = require('./config');
const cache = require('./cache');

module.exports = {
    verify_scopes
};

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
    const cached_token_info_result = cache.get('client', access_token);

    if (!cached_token_info_result) {
        return cudl.get
            .to(config.base_url + config.path + '/oauth/tokeninfo')
            .send({access_token: access_token})
            .promise()
            .then(result => {
                cache.set('server', access_token, result, config.server_expiry);

                return result;
            })
            .catch(error => Promise.reject(
                _.has(error, 'response.message')
                    ? error.response
                    : error
                )
            );
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
