var assert = require("assert");
var vizion = require("..");

/*
	To enable a sample test suite, remove the _disabled
	and fill in the strings.  One way to fetch these values is to
	create the sample directory, enter it as the directory,
	and then run this test suite (npm test).
	The test will return the expected value (a blank string),
	and the actual value, which can be then used as the string to
	test.
*/
var sample = {
	git: {
		directory: "test/fixtures/test_git/",
		url: "https://github.com/jshkurti/vizionar_test.git",
		revision: "c67bdb927d59a58d835a572acb86b971603a8662",
		comment: "dat commit though",
		branch: "development",
    next_rev: null,
    prev_rev: '2e507d1b43e27eb17c09efa429146e962430092c',
		update_time: "Tue, 21 Oct 2014 14:17:06 +0200"
	},
	svn: {
		directory: "test/fixtures/test_svn/",
		url: "https://github.com/jshkurti/vizionar_test",
		revision: "r3",
		comment: "dat commit though",
		branch: "vizionar_test",
		update_time: "2014-10-21T12:29:21.289Z"
	},
	hg: {
		directory: "test/fixtures/test_hg/",
		url: "https://jshkurti@bitbucket.org/jshkurti/vizionar_test",
		revision: "0:a070c08854c3",
		comment: "Initial commit with contributors",
		branch: "default",
		update_time: "2014-10-21T12:42:31.017Z"
	}
};

describe("vizion.analyze()", function() {
	if(sample.git && sample.git.directory.length > 1) {
		it("Should pull from Git", function(done) {
      this.timeout(5000);
			vizion.analyze({folder: sample.git.directory}, function(err, metadata) {
				assert.equal(err, null);
				assert.equal(metadata.url, sample.git.url);
				assert.equal(metadata.revision, sample.git.revision);
				assert.equal(metadata.comment, sample.git.comment);
				assert.equal(metadata.next_rev, sample.git.next_rev);
        assert.equal(metadata.prev_rev, sample.git.prev_rev);
        assert.equal(metadata.branch, sample.git.branch);
				//assert.equal(metadata.update_time, sample.git.update_time);
				done();
			});
		});
	}
	if(sample.svn && sample.svn.directory.length > 1) {
		it("Pulling from Subversion", function(done) {
      this.timeout(5000);
			vizion.analyze({folder: sample.svn.directory}, function(err, metadata) {
				assert.equal(err, null);
				assert.equal(metadata.url, sample.svn.url);
				assert.equal(metadata.revision, sample.svn.revision);
				assert.equal(metadata.comment, sample.svn.comment);
				assert.equal(metadata.branch, sample.svn.branch);
				//assert.equal(""+metadata.update_time, sample.svn.update_time);
				done();
			});
		});
	}
	if(sample.hg && sample.hg.directory.length > 1) {
		it("Pulling from Mercurial", function(done) {
      this.timeout(5000);
			vizion.analyze({folder: sample.hg.directory}, function(err, metadata) {
				assert.equal(err, null);
				assert.equal(metadata.url, sample.hg.url);
				assert.equal(metadata.revision, sample.hg.revision);
				assert.equal(metadata.comment, sample.hg.comment);
				assert.equal(metadata.branch, sample.hg.branch);
				//assert.equal(""+metadata.update_time, sample.hg.update_time);
				done();
			});
		});
	}
});
