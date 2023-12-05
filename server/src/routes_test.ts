import assert from "assert";
import * as httpMocks from 'node-mocks-http';
import {add, advanceTimeForTesting, get, list, resetPollsForTesting, vote} from "./routes";

describe('routes', function () {

    // add tests for your routes
    // Tests for /api/add
    it('add', function () {
        // Separate domain for each branch:
        // 1. Missing name
        const req1 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add', body: {}});
        const res1 = httpMocks.createResponse();
        add(req1, res1);
        assert.strictEqual(res1._getStatusCode(), 400);
        assert.deepStrictEqual(res1._getData(),
            'required argument "name" was missing');

        // 2. Missing minutes
        const req2 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch"}});
        const res2 = httpMocks.createResponse();
        add(req2, res2);
        assert.strictEqual(res2._getStatusCode(), 400);
        assert.deepStrictEqual(res2._getData(),
            'required argument "minutes" was missing')

        // 3. Invalid minutes
        const req3 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 0}});
        const res3 = httpMocks.createResponse();
        add(req3, res3);
        assert.strictEqual(res3._getStatusCode(), 400);
        assert.deepStrictEqual(res3._getData(),
            "'minutes' is not a positive integer: 0");

        const req4 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 3.5}});
        const res4 = httpMocks.createResponse();
        add(req4, res4);
        assert.strictEqual(res4._getStatusCode(), 400);
        assert.deepStrictEqual(res4._getData(),
            "'minutes' is not a positive integer: 3.5");

        // 4. Missing options
        const req5 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 3, options: 3}});
        const res5 = httpMocks.createResponse();
        add(req5, res5);
        assert.strictEqual(res5._getStatusCode(), 400);
        assert.deepStrictEqual(res5._getData(),
            'required argument "options" was missing');

        const req6 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 4, options: [12, 21]}});
        const res6 = httpMocks.createResponse();
        add(req6, res6);
        assert.strictEqual(res6._getStatusCode(), 400);
        assert.deepStrictEqual(res6._getData(),
            'required argument "options" was missing');

        // 5. Invalid options
        const req9 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 3, options: []}});
        const res9 = httpMocks.createResponse();
        add(req9, res9);
        assert.strictEqual(res9._getStatusCode(), 400);
        assert.deepStrictEqual(res9._getData(),
            `The number of options is less than 2: ${req9.body.options.length}`);

        const req10 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 4, options: ["eric"]}});
        const res10 = httpMocks.createResponse();
        add(req10, res10);
        assert.strictEqual(res10._getStatusCode(), 400);
        assert.deepStrictEqual(res10._getData(),
            `The number of options is less than 2: ${req10.body.options.length}`);

        // 6. Correctly added
        const req7 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 4, options: ["eric1", "eric2"]}});
        const res7 = httpMocks.createResponse();
        add(req7, res7);
        assert.strictEqual(res7._getStatusCode(), 200);
        assert.deepStrictEqual(res7._getData().poll.name, "couch");
        const endTime7 = res7._getData().poll.endTime;
        assert.ok(Math.abs(endTime7 - Date.now() - 4 * 60 * 1000) < 50);
        assert.deepStrictEqual(res7._getData().poll.options, ["eric1", "eric2"]);

        const req8 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "chair", minutes: 2, options: ["eric1", "eric2", "eric3"]}});
        const res8 = httpMocks.createResponse();
        add(req8, res8);
        assert.strictEqual(res8._getStatusCode(), 200);
        assert.deepStrictEqual(res8._getData().poll.name, "chair");
        const endTime8 = res8._getData().poll.endTime;
        assert.ok(Math.abs(endTime8 - Date.now() - 2 * 60 * 1000) < 50);
        assert.deepStrictEqual(res8._getData().poll.options, ["eric1", "eric2", "eric3"]);

        resetPollsForTesting();
    });

    // Tests for /api/get
    it('get', function () {
        const req1 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 5, options: ["eric1", "eric2", "eric3"]}});
        const res1 = httpMocks.createResponse();
        add(req1, res1);
        assert.strictEqual(res1._getStatusCode(), 200);
        assert.deepStrictEqual(res1._getData().poll.name, "couch");
        assert.deepStrictEqual(res1._getData().poll.options, ["eric1", "eric2", "eric3"]);

        const req2 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "chair", minutes: 10, options: ["eric1", "eric2", "eric3"]}});
        const res2 = httpMocks.createResponse();
        add(req2, res2);
        assert.strictEqual(res2._getStatusCode(), 200);
        assert.deepStrictEqual(res2._getData().poll.name, "chair");
        assert.deepStrictEqual(res2._getData().poll.options, ["eric1", "eric2", "eric3"]);

        // Separate domain for each branch:
        // 1. Missing name
        const req3 = httpMocks.createRequest(
            {method: 'POST', url: '/api/get', body: {}});
        const res3 = httpMocks.createResponse();
        get(req3, res3);
        assert.strictEqual(res3._getStatusCode(), 400);
        assert.deepStrictEqual(res3._getData(),
            "missing or invalid 'name' parameter");

        // 2. Invalid name
        const req4 = httpMocks.createRequest(
            {method: 'POST', url: '/api/get',
                body: {name: "fridge"}});
        const res4 = httpMocks.createResponse();
        get(req4, res4);
        assert.strictEqual(res4._getStatusCode(), 400);
        assert.deepStrictEqual(res4._getData(), `no poll with name '${req4.body.name}'`);

        const req5 = httpMocks.createRequest(
            {method: 'POST', url: '/api/get',
                body: {name: "stool"}});
        const res5 = httpMocks.createResponse();
        get(req5, res5);
        assert.strictEqual(res5._getStatusCode(), 400);
        assert.deepStrictEqual(res5._getData(), `no poll with name '${req5.body.name}'`);

        // 3. Poll found
        const req6 = httpMocks.createRequest(
            {method: 'POST', url: '/api/get', body: {name: "couch"}});
        const res6 = httpMocks.createResponse();
        get(req6, res6);
        assert.strictEqual(res6._getStatusCode(), 200);
        assert.deepStrictEqual(res6._getData().poll.name, "couch");
        assert.deepStrictEqual(res6._getData().poll.minutes, 5);
        assert.deepStrictEqual(res6._getData().poll.options, ["eric1", "eric2", "eric3"]);

        const req7 = httpMocks.createRequest(
            {method: 'POST', url: '/api/get', body: {name: "chair"}});
        const res7 = httpMocks.createResponse();
        get(req7, res7);
        assert.strictEqual(res7._getStatusCode(), 200);
        assert.deepStrictEqual(res7._getData().poll.name, "chair");
        assert.deepStrictEqual(res7._getData().poll.minutes, 10);
        assert.deepStrictEqual(res7._getData().poll.options, ["eric1", "eric2", "eric3"]);

        resetPollsForTesting();
    });

    it('list', function () {
        const req1 = httpMocks.createRequest(
            {method: 'GET', url: '/api/list', query: {}});
        const res1 = httpMocks.createResponse();
        list(req1, res1);
        assert.strictEqual(res1._getStatusCode(), 200);
        assert.deepStrictEqual(res1._getData(), {polls: []});

        const req2 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 10, options: ["eric1", "eric2", "eric3"]}});
        const res2 = httpMocks.createResponse();
        add(req2, res2);
        assert.strictEqual(res2._getStatusCode(), 200);
        assert.deepStrictEqual(res2._getData().poll.name, "couch");
        assert.deepStrictEqual(res2._getData().poll.minutes, 10);
        assert.deepStrictEqual(res2._getData().poll.options, ["eric1", "eric2", "eric3"]);

        const req3 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "chair", minutes: 5, options: ["eric4", "eric5", "eric6"]}});
        const res3 = httpMocks.createResponse();
        add(req3, res3);
        assert.strictEqual(res3._getStatusCode(), 200);
        assert.deepStrictEqual(res3._getData().poll.name, "chair");
        assert.deepStrictEqual(res3._getData().poll.minutes, 5);
        assert.deepStrictEqual(res3._getData().poll.options, ["eric4", "eric5", "eric6"]);

        const req4 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "stool", minutes: 15, options: ["eric7", "eric8", "eric9"]}});
        const res4 = httpMocks.createResponse();
        add(req4, res4);
        assert.strictEqual(res4._getStatusCode(), 200);
        assert.deepStrictEqual(res4._getData().poll.name, "stool");
        assert.deepStrictEqual(res4._getData().poll.minutes, 15);
        assert.deepStrictEqual(res4._getData().poll.options, ["eric7", "eric8", "eric9"]);

        // NOTE: chair goes first because it finishes sooner
        const req5 = httpMocks.createRequest(
            {method: 'GET', url: '/api/list', query: {}});
        const res5 = httpMocks.createResponse();
        list(req5, res5);
        assert.strictEqual(res5._getStatusCode(), 200);
        assert.deepStrictEqual(res5._getData().polls.length, 3);
        assert.deepStrictEqual(res5._getData().polls[0].name, "chair");
        assert.deepStrictEqual(res5._getData().polls[1].name, "couch");
        assert.deepStrictEqual(res5._getData().polls[2].name, "stool");

        // Push time forward by over 5 minutes
        advanceTimeForTesting(5 * 60 * 1000 + 50);

        // NOTE: chair goes after because it has finished
        const req6 = httpMocks.createRequest(
            {method: 'GET', url: '/api/list', query: {}});
        const res6 = httpMocks.createResponse();
        list(req6, res6);
        assert.strictEqual(res6._getStatusCode(), 200);
        assert.deepStrictEqual(res6._getData().polls.length, 3);
        assert.deepStrictEqual(res6._getData().polls[0].name, "couch");
        assert.deepStrictEqual(res6._getData().polls[1].name, "stool");
        assert.deepStrictEqual(res6._getData().polls[2].name, "chair");

        // Push time forward by another 5 minutes
        advanceTimeForTesting(5 * 60 * 1000);

        // NOTE: chair stays after because it finished first
        const req7 = httpMocks.createRequest(
            {method: 'GET', url: '/api/list', query: {}});
        const res7 = httpMocks.createResponse();
        list(req7, res7);
        assert.strictEqual(res7._getStatusCode(), 200);
        assert.deepStrictEqual(res7._getData().polls.length, 3);
        assert.deepStrictEqual(res7._getData().polls[0].name, "stool");
        assert.deepStrictEqual(res7._getData().polls[1].name, "couch");
        assert.deepStrictEqual(res7._getData().polls[2].name, "chair");

        // Push time forward by another 20 minutes (all are completed)
        advanceTimeForTesting(20 * 60 * 1000);

        // NOTE: chair stays after because it finished first
        const req8 = httpMocks.createRequest(
            {method: 'GET', url: '/api/list', query: {}});
        const res8 = httpMocks.createResponse();
        list(req8, res8);
        assert.strictEqual(res8._getStatusCode(), 200);
        assert.deepStrictEqual(res8._getData().polls.length, 3);
        assert.deepStrictEqual(res8._getData().polls[0].name, "stool");
        assert.deepStrictEqual(res8._getData().polls[1].name, "couch");
        assert.deepStrictEqual(res8._getData().polls[2].name, "chair");

        resetPollsForTesting();
    });

    it('vote', function () {
        const req1 = httpMocks.createRequest(
            {method: 'POST', url: '/api/add',
                body: {name: "couch", minutes: 5, options: ["eric1", "eric2", "eric3"]}});
        const res1 = httpMocks.createResponse();
        add(req1, res1);
        assert.strictEqual(res1._getStatusCode(), 200);
        assert.deepStrictEqual(res1._getData().poll.name, "couch");
        assert.deepStrictEqual(res1._getData().poll.minutes, 5);
        assert.deepStrictEqual(res1._getData().poll.options, ["eric1", "eric2", "eric3"]);

        // Separate domain for each branch:
        // 1. Missing voter
        const req2 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote', body: {}});
        const res2 = httpMocks.createResponse();
        vote(req2, res2);
        assert.strictEqual(res2._getStatusCode(), 400);
        assert.deepStrictEqual(res2._getData(),
            "missing or invalid 'voter' parameter");

        // 2. Missing name
        const req3 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote', body: {voter: "Barney"}});
        const res3 = httpMocks.createResponse();
        vote(req3, res3);
        assert.strictEqual(res3._getStatusCode(), 400);
        assert.deepStrictEqual(res3._getData(),
            "missing or invalid 'name' parameter");

        // 3. Invalid name
        const req4 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "chair"}});
        const res4 = httpMocks.createResponse();
        vote(req4, res4);
        assert.strictEqual(res4._getStatusCode(), 400);
        assert.deepStrictEqual(res4._getData(), `no poll with name '${req4.body.name}'`);

        const req5 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "stool"}});
        const res5 = httpMocks.createResponse();
        vote(req5, res5);
        assert.strictEqual(res5._getStatusCode(), 400);
        assert.deepStrictEqual(res5._getData(), `no poll with name '${req5.body.name}'`);

        // 4. Option missing
        const req6 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "couch"}});
        const res6 = httpMocks.createResponse();
        vote(req6, res6);
        assert.strictEqual(res6._getStatusCode(), 400);
        assert.deepStrictEqual(res6._getData(),
            "missing or invalid 'option' parameter");

        // 5. Option invalid
        const req7 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "couch", option: "eric4"}});
        const res7 = httpMocks.createResponse();
        vote(req7, res7);
        assert.strictEqual(res7._getStatusCode(), 400);
        assert.deepStrictEqual(res7._getData(),
            `This is not a option in this poll: ${req7.body.option}`);

        const req8 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "couch", option: "eric5"}});
        const res8 = httpMocks.createResponse();
        vote(req8, res8);
        assert.strictEqual(res8._getStatusCode(), 400);
        assert.deepStrictEqual(res8._getData(),
            `This is not a option in this poll: ${req8.body.option}`);

        // 6. Vote made
        const req10 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "couch", option: "eric1"}});
        const res10 = httpMocks.createResponse();
        vote(req10, res10);
        assert.strictEqual(res10._getStatusCode(), 200);
        assert.deepStrictEqual(res10._getData().poll.name, "couch");
        const votes1 = res10._getData().poll.votes
        let voteIndex1 = -1
        for (let i = 0; i < votes1.length; i++) {
            if (votes1[i].voter === req10.body.voter) voteIndex1 = i
        }
        assert.deepStrictEqual(res10._getData().poll.votes[voteIndex1].voter, "Barney");
        assert.deepStrictEqual(res10._getData().poll.votes[voteIndex1].option, "eric1");

        const req11 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Fred", name: "couch", option: "eric2"}});
        const res11 = httpMocks.createResponse();
        vote(req11, res11);
        assert.strictEqual(res11._getStatusCode(), 200);
        assert.deepStrictEqual(res11._getData().poll.name, "couch");
        const votes2 = res11._getData().poll.votes
        let voteIndex2 = -1
        for (let i = 0; i < votes2.length; i++) {
            if (votes2[i].voter === req11.body.voter) voteIndex2 = i
        }
        assert.deepStrictEqual(res11._getData().poll.votes[voteIndex2].voter, "Fred");
        assert.deepStrictEqual(res11._getData().poll.votes[voteIndex2].option, "eric2");

        // Push time forward by over 5 minutes
        advanceTimeForTesting(5 * 60 * 1000 + 50);

        // 8. Auction over (advanceTimeForTesting) [separate test]
        const req12 = httpMocks.createRequest(
            {method: 'POST', url: '/api/vote',
                body: {voter: "Barney", name: "couch", option: "eric1"}});
        const res12 = httpMocks.createResponse();
        vote(req12, res12);
        assert.strictEqual(res12._getStatusCode(), 400);
        assert.deepStrictEqual(res12._getData(),
            `poll for "${req12.body.name}" has already ended`);

        resetPollsForTesting();
    });
});
