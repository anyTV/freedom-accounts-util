'use strict';

const accounts = require('../index.js');

const chai = require('chai');
const chai_as_promised = require('chai-as-promised');
const nock = require('nock');
const httpMocks = require('node-mocks-http');
const moment = require('moment');


chai.should();
chai.use(chai_as_promised);

const configuration = {
    base_url: 'https://localhost',
    path: '/api',
    client_id: 'test_id',
    client_secret: 'test_secret'
};

const scopes = ['https://localhost/scope'];

const nocks = {
    token_info: access_token => {
        return nock(configuration.base_url)
            .get(configuration.path + '/oauth/tokeninfo')
            .query({access_token});
    }
};

const responses = {
    valid_token_info: {
        date_expiration: moment().add(30, 'minute').format('x'),
        scopes: scopes.join(' ')
    },
    expired_token_info: {
        date_expiration: moment().format('x'),
        scopes: scopes.join(' ')
    }
};

describe('verify_scopes', function () {

    const error_handler = error => (error ? Promise.reject(error) : Promise.resolve());

    accounts.configure(configuration);

    beforeEach(function () {
        accounts.clear_cache('server');
        nock.cleanAll();
    });

    it('should fail without a provided access token', function () {
        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            params: {}
        });

        return accounts.verify_scopes(scopes)(
            request, null, error_handler
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal('Access token is required.');
        });
    });

    it('should retry and forward remote failure', function () {
        let accounts_nocks = [
            nocks.token_info('notjrrtoken').reply(500, {message: 'random server error 1'}),
            nocks.token_info('notjrrtoken').reply(500, {message: 'random server error 2'}),
            nocks.token_info('notjrrtoken').reply(500, {message: 'random server error 3'})
        ];

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'notjrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request, null, error_handler
        ).catch(error => {
            accounts_nocks.forEach(accounts_nock => accounts_nock.isDone().should.equal(true));
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal('random server error 3');
        });
    });

    it('should fail without returned scopes', function () {
        let accounts_nock = nocks.token_info('notjrrtoken')
            .reply(200, {});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'notjrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request, null, error_handler
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal('Something went wrong, server did not return scopes, please try again.');
            accounts_nock.isDone().should.equal(true);
        });
    });

    it('should fail without any of the required scopes', function () {
        let accounts_nock = nocks.token_info('notjrrtoken')
            .reply(200, {scopes: 'http://non.existing/scope'});

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'notjrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request, null, error_handler
        ).catch(error => {
            error.should.have.property('message');
            error.message.should.be.a('string');
            error.message.should.equal(
                'You need at least one of the ff. scopes to access this endpoint: ' + scopes.join(' ')
            );
            accounts_nock.isDone().should.equal(true);
        });
    });

    it('should succeed with proper provided access token', function () {
        let accounts_nock = nocks.token_info('jrrtoken')
            .reply(200, responses.valid_token_info);

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'jrrtoken'}
        });


        return accounts.verify_scopes(scopes)(request, null, error_handler)
            .then(() => {
                accounts_nock.isDone().should.equal(true);
            });
    });

    it('should succeed with cached access token info', function () {
        let accounts_nock = nocks.token_info('jrrtoken')
            .reply(200, responses.valid_token_info);

        let accounts_renock = nocks.token_info('jrrtoken')
            .reply(200, responses.valid_token_info);

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'jrrtoken'}
        });


        return accounts.verify_scopes(scopes)(request, null, error_handler)
            .then(() => {
                accounts_nock.isDone().should.equal(true);
            })
            .then(accounts.verify_scopes(scopes).bind({}, request, null, error_handler))
            .then(() => {
                accounts_renock.isDone().should.not.equal(true);
            });
    });

    it('should request again with expired access token', function () {

        let accounts_nock = nocks.token_info('jrrtoken')
            .reply(200, responses.expired_token_info);

        let accounts_expired_nock = nocks.token_info('jrrtoken')
            .reply(200, responses.expired_token_info);

        const request = httpMocks.createRequest({
            method: 'GET',
            url: '/test',
            headers: {'Access-Token': 'jrrtoken'}
        });


        return accounts.verify_scopes(scopes)(
            request, null, error_handler
        ).then(() => {
            accounts_nock.isDone().should.equal(true);
        }).then(accounts.verify_scopes(scopes)(
            request, null, error_handler
        )).then(() => {
            accounts_expired_nock.isDone().should.equal(true);
        });
    });
});
