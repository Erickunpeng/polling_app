import assert from 'assert';
import * as httpMocks from 'node-mocks-http';
import {list, load, resetPollsForTesting, save} from './routes';


describe('routes', function() {

  // add tests for your routes
  // Tests for /api/save
  it('save', function () {
    // First branch, straight line code, error case (only one possible input)
    const req1 = httpMocks.createRequest(
        {method: 'POST', url: '/api/save', body: {value: "some stuff"}});
    const res1 = httpMocks.createResponse();
    save(req1, res1);

    assert.strictEqual(res1._getStatusCode(), 400);
    assert.deepStrictEqual(res1._getData(),
        'required argument "name" was missing');

    // Second branch, straight line code, error case (only one possible input)
    const req2 = httpMocks.createRequest(
        {method: 'POST', url: '/api/save', body: {name: "A"}});
    const res2 = httpMocks.createResponse();
    save(req2, res2);

    assert.strictEqual(res2._getStatusCode(), 400);
    assert.deepStrictEqual(res2._getData(),
        'required argument "value" was missing');

    // Third branch, straight line code
    const req3 = httpMocks.createRequest({method: 'POST', url: '/api/save',
      body: {name: "A", value: "some stuff"}});
    const res3 = httpMocks.createResponse();
    save(req3, res3);

    assert.strictEqual(res3._getStatusCode(), 200);
    assert.deepStrictEqual(res3._getData(), {replaced: false});

    const req4 = httpMocks.createRequest({method: 'POST', url: '/api/save',
      body: {name: "A", value: "different stuff"}});
    const res4 = httpMocks.createResponse();
    save(req4, res4);

    assert.strictEqual(res4._getStatusCode(), 200);
    assert.deepStrictEqual(res4._getData(), {replaced: true});
    resetPollsForTesting()
  });

  // Tests for /api/load
  it('load', function () {

    const saveReq = httpMocks.createRequest({
      method: 'POST',
      url: '/api/save',
      body: { name: "some text", value: "some content" }
    });
    const saveRes = httpMocks.createResponse();
    save(saveReq, saveRes);

    // Third branch, straight line code. Testing loading the saved file
    const loadReq1 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/load',
      query: { name: "some text" }
    });
    const loadRes1 = httpMocks.createResponse();
    load(loadReq1, loadRes1);
    assert.strictEqual(loadRes1._getStatusCode(), 200);
    assert.deepStrictEqual(loadRes1._getData(), { value: "some content" });

    // Second branch, straight line code, error case.
    // Testing loading a non-existing file
    const loadReq2 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/load',
      query: { name: "nonexistent name1" }
    });
    const loadRes2 = httpMocks.createResponse();
    load(loadReq2, loadRes2);
    assert.strictEqual(loadRes2._getStatusCode(), 404);
    assert.deepStrictEqual(loadRes2._getData(), `no transcript called "${loadReq2.query.name}" was found`) // 1st

    const loadReq3 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/load',
      query: { name: "nonexistent name2" }
    });
    const loadRes3 = httpMocks.createResponse();
    load(loadReq3, loadRes3);
    assert.strictEqual(loadRes3._getStatusCode(), 404);
    assert.deepStrictEqual(loadRes3._getData(), `no transcript called "${loadReq3.query.name}" was found`) // 2nd

    // First branch, straight line code, error case (only one possible input)
    // Testing loading without providing a name
    const loadReq4 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/load'
    });
    const loadRes4 = httpMocks.createResponse();
    load(loadReq4, loadRes4);
    assert.strictEqual(loadRes4._getStatusCode(), 400);
    assert.deepStrictEqual(loadRes4._getData(), 'required argument "name" was missing') // 1st

    const loadReq5 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/load',
      query: { msg: "some text"}
    });
    const loadRes5 = httpMocks.createResponse();
    load(loadReq5, loadRes5);
    assert.strictEqual(loadRes5._getStatusCode(), 400);
    assert.deepStrictEqual(loadRes5._getData(), 'required argument "name" was missing') // 2nd
    resetPollsForTesting()
  });

  it('list', function () {

    // No files saved
    const listReq1 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/list',
    });
    const listRes1 = httpMocks.createResponse();
    list(listReq1, listRes1);
    assert.strictEqual(listRes1._getStatusCode(), 200);
    assert.deepStrictEqual(listRes1._getData(), { list: [] });
    resetPollsForTesting()

    // List 1 file
    // Case 1
    const saveReq1 = httpMocks.createRequest({
      method: 'POST',
      url: '/api/save',
      body: { name: "some text", value: "some content" }
    });
    const saveRes1 = httpMocks.createResponse();
    save(saveReq1, saveRes1);
    const listReq2 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/list',
    });
    const listRes2 = httpMocks.createResponse();
    list(listReq2, listRes2);
    assert.strictEqual(listRes2._getStatusCode(), 200);
    assert.deepStrictEqual(listRes2._getData(), { list: ["some text"] });
    resetPollsForTesting()

    // Case 2
    const saveReq2 = httpMocks.createRequest({
      method: 'POST',
      url: '/api/save',
      body: { name: "something", value: "some content" }
    });
    const saveRes2 = httpMocks.createResponse();
    save(saveReq2, saveRes2);
    const listReq3 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/list',
    });
    const listRes3 = httpMocks.createResponse();
    list(listReq3, listRes3);
    assert.strictEqual(listRes3._getStatusCode(), 200);
    assert.deepStrictEqual(listRes3._getData(), { list: ["something"] });
    resetPollsForTesting()

    // List many files
    // Case 1
    const saveReq3 = httpMocks.createRequest({
      method: 'POST',
      url: '/api/save',
      body: { name: "something fun", value: "some content" }
    });
    const saveRes3 = httpMocks.createResponse();
    save(saveReq3, saveRes3);
    const saveReq4 = httpMocks.createRequest({
      method: 'POST',
      url: '/api/save',
      body: { name: "something funny", value: "some content" }
    });
    const saveRes4 = httpMocks.createResponse();
    save(saveReq4, saveRes4);
    const listReq4 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/list',
    });
    const listRes4 = httpMocks.createResponse();
    list(listReq4, listRes4);
    assert.strictEqual(listRes4._getStatusCode(), 200);
    assert.deepStrictEqual(listRes4._getData(), { list: ["something fun", "something funny"] });

    // Case 2
    const saveReq5 = httpMocks.createRequest({
      method: 'POST',
      url: '/api/save',
      body: { name: "something bad", value: "some content" }
    });
    const saveRes5 = httpMocks.createResponse();
    save(saveReq5, saveRes5);
    const listReq5 = httpMocks.createRequest({
      method: 'GET',
      url: '/api/list',
    });
    const listRes5 = httpMocks.createResponse();
    list(listReq5, listRes5);
    assert.strictEqual(listRes5._getStatusCode(), 200);
    assert.deepStrictEqual(listRes5._getData(),
        { list: ["something fun", "something funny", "something bad"] });
    resetPollsForTesting()
  });

});
