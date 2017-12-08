'use strict';

const accounts = require('../index.js');

const chai = require('chai');
const chai_as_promised = require('chai-as-promised');
const nock = require('nock');


chai.should();
chai.use(chai_as_promised);

const configuration = {
    base_url: 'https://accounts.freedom.tm',
    path: '/api/v2',
    client_id: 'devtest',
    client_secret: 'devtest'
};

const scopes = ['https://frnky.api.tm/cms'];

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

describe('generate_token', () => {

    accounts.configure(configuration);

    it('should get access token with specified scope', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.client_credentials)
            .reply(200, {access_token: 'jrrtoken'});

        accounts.configure({client_expiry: 0});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);
            });
    });

    it('should get expired access token again with specified scope', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.client_credentials)
            .reply(200, {access_token: 'jrrtoken'});

        accounts.configure({client_expiry: 300});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);
            });
    });

    it('should get cached access token with specified scope', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.client_credentials)
            .reply(200, {access_token: 'jrrtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.not.equal(true);

                nock.cleanAll();
            });
    });

    it('should not get cached access token when cached is cleared', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.client_credentials)
            .reply(200, {access_token: 'jrrtoken'});

        accounts.clear_cache('client');

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('jrrtoken');
                accounts_nock.isDone().should.equal(true);

                nock.cleanAll();
            });
    });
});

describe('refresh_token', () => {

    accounts.configure(configuration);

    it('should properly refresh token', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.client_credentials)
            .reply(200, {access_token: 'jrrtoken', refresh_token: 'jrrrefreshtoken'});

        let accounts_refresh_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.refresh_token)
            .reply(200, {access_token: 'freshjrrtoken', refresh_token: 'jrrrefreshtoken'});

        accounts.clear_cache('client');

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

    it('should properly update cache of refreshed token', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payloads.client_credentials)
            .reply(200, {access_token: 'jrrtoken', refresh_token: 'jrrrefreshtoken'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.have.property('access_token');
                result.access_token.should.be.a('string');
                result.access_token.should.equal('freshjrrtoken');
                result.should.have.property('refresh_token');
                result.refresh_token.should.be.a('string');
                result.refresh_token.should.equal('jrrrefreshtoken');
                accounts_nock.isDone().should.not.equal(true);

                nock.cleanAll();
            });
    });
});
