/* globals describe it */

const assert = require('assert');
const HHHDatabaseInterface = require('../bin/HHHDatabaseInterface.js');

describe('HHH Database Interface', function () {
  describe('doing something', function () {
    it('should work', function () {
      let result = new HHHDatabaseInterface();
      assert.equals(7, result);
    });
  });
});
