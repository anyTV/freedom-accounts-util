'use strict';

const accounts = require('../index.js');

const chai = require('chai');
const chai_as_promised = require('chai-as-promised');
const nock = require('nock');


chai.should();
chai.use(chai_as_promised);

const configuration = {
    base_url: 'https://localhost',
    path: '/api',
    client_id: 'test_id',
    client_secret: 'test_secret'
};

const scopes = ['https://localhost/scope'];

const payloads = {
    client_credentials: {
        client_id: configuration.client_id,
        client_secret: configuration.client_secret,
        scopes: scopes.join(' '),
        grant_type: 'client_credentials'
    },
    refresh_token: {
        client_id: configuration.client_id,
        client_secret: configuration.client_secret,
        grant_type: 'refresh_token',
        refresh_token: 'jrrrefreshtoken'
    }
};

const nocks = {
    token: payload => {
        return nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads[payload]);
    }
};

describe('generate_token', function () {

    accounts.configure(configuration);

    beforeEach(function () {
        accounts.configure({client_expiry: 300});
        accounts.clear_cache('client');
        nock.cleanAll();
    });

    it('should get access token with specified scope', function () {
        let accounts_nock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);
            });
    });

    it('should get expired access token again with specified scope', function () {
        let accounts_nock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        let accounts_renock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        accounts.configure({client_expiry: 0});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);

                return scopes;
            })
            .then(accounts.generate_token)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_renock.isDone().should.equal(true);
            });
    });

    it('should get cached access token with specified scope', function () {
        let accounts_nock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        let accounts_renock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);

                return scopes;
            })
            .then(accounts.generate_token)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_renock.isDone().should.not.equal(true);
            });
    });

    it('should not get cached access token when cached is cleared', function () {
        let accounts_nock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        let accounts_renock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);

                accounts.clear_cache('client');

                return scopes;
            })
            .then(accounts.generate_token)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_renock.isDone().should.equal(true);
            });
    });
});

describe('refresh_token', function () {

    accounts.configure(configuration);

    beforeEach(function () {
        accounts.clear_cache('client');
        nock.cleanAll();
    });

    it('should properly refresh token', function () {
        let accounts_nock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken', refresh_token: 'jrrrefreshtoken'});

        let accounts_refresh_nock = nocks.token('refresh_token')
            .reply(200, {access_token: 'freshjrrtoken', refresh_token: 'jrrrefreshtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                result.should.have.property('refresh_token');
                result.refresh_token.should.be.a('string');
                result.refresh_token.should.equal('jrrrefreshtoken');
                accounts_nock.isDone().should.equal(true);

                return result.refresh_token;
            })
            .then(accounts.refresh_token)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('freshjrrtoken');
                result.should.have.property('refresh_token');
                result.refresh_token.should.be.a('string');
                result.refresh_token.should.equal('jrrrefreshtoken');
                accounts_refresh_nock.isDone().should.equal(true);

                nock.cleanAll();
            });
    });

    it('should properly update cache of refreshed token', function () {
        let accounts_nock = nocks.token('client_credentials')
            .reply(200, {access_token: 'jrrtoken', refresh_token: 'jrrrefreshtoken'});

        let accounts_refresh_nock = nocks.token('refresh_token')
            .reply(200, {access_token: 'freshjrrtoken', refresh_token: 'jrrrefreshtoken'});

        let accounts_rerefresh_nock = nocks.token('refresh_token')
            .reply(200, {access_token: 'veryfreshjrrtoken', refresh_token: 'jrrrefreshtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                result.should.have.property('refresh_token');
                result.refresh_token.should.be.a('string');
                result.refresh_token.should.equal('jrrrefreshtoken');
                accounts_nock.isDone().should.equal(true);

                return result.refresh_token;
            })
            .then(accounts.refresh_token)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('freshjrrtoken');
                result.should.have.property('refresh_token');
                result.refresh_token.should.be.a('string');
                result.refresh_token.should.equal('jrrrefreshtoken');
                accounts_refresh_nock.isDone().should.equal(true);

                return result.refresh_token;
            })
            .then(accounts.refresh_token)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('veryfreshjrrtoken');
                result.should.have.property('refresh_token');
                result.refresh_token.should.be.a('string');
                result.refresh_token.should.equal('jrrrefreshtoken');
                accounts_rerefresh_nock.isDone().should.equal(true);
            });
    });
});
