var expect = require('chai').expect;
var helper = require('../../lib/helper');

describe('Unit: helper', function () {

    it('findLast', function it(done) {
      expect(helper.findLast(null)).to.eq(undefined);
      expect(helper.findLast(undefined)).to.eq(undefined);
      expect(helper.findLast([])).to.eq(undefined);
      expect(helper.findLast([1, 2, 3])).to.eq(3);
      done();
    });

    it('trimNewLine', function it(done) {
      expect(helper.trimNewLine(123)).to.eq(123);
      expect(helper.trimNewLine(undefined)).to.eq(undefined);
      expect(helper.trimNewLine(' foo\nbar ')).to.eq(' foobar ');
      expect(helper.trimNewLine(' foo ')).to.eq(' foo ');
      expect(helper.trimNewLine('')).to.eq('');
      done();
    });

});