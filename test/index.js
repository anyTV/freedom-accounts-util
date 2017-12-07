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

describe('accounts client', () => {
    const payload = {
        client_id: configuration.client_id,
        client_secret: configuration.client_secret,
        scopes: scopes.join(' '),
        grant_type: 'client_credentials'
    };

    accounts.configure(configuration);

    it('should get access token with specified scope', () => {
            let accounts_nock = nock(configuration.base_url)
                .post(configuration.path + '/oauth/token', payload)
                .reply(200, {access_token: 'blabla'});

            accounts.configure({client_expiry: 0});

            return accounts.generate_token(scopes)
                .then(result => {
                    result.should.be.a('string');
                    accounts_nock.isDone().should.equal(true);
                });
    });



    it('should get expired access token again with specified scope', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payload)
            .reply(200, {access_token: 'blabla'});

        accounts.configure({client_expiry: 600});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.be.a('string');
                accounts_nock.isDone().should.equal(true);
            });
    });


    it('should get cached access token with specified scope', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payload)
            .reply(200, {access_token: 'blabla'});

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.be.a('string');
                accounts_nock.isDone().should.not.equal(true);

                nock.cleanAll();
            });
    });

    it('should not get cached access token when cached is cleared', () => {
        let accounts_nock = nock(configuration.base_url)
            .post(configuration.path + '/oauth/token', payload)
            .reply(200, {access_token: 'blabla'});

        accounts.clear_cache();

        return accounts.generate_token(scopes)
            .then(result => {
                result.should.be.a('string');
                accounts_nock.isDone().should.equal(true);

                nock.cleanAll();
            });
    });
});
