var fs = require('fs');
var async = require('async');

var isGit = function(cb) {
  fs.exists(folder+'.git', function(exists) {
		if (exists)
			return cb('git');
    return cb(null);
  });
}

var isHg = function(cb) {
  fs.exists(folder+'.hg', function(exists) {
		if (exists)
			return cb('hg');
    return cb(null);
  });
}

var isSvn = function(cb) {
  fs.exists(folder+'.svn', function(exists) {
		if (exists)
			return cb('svn');
    return cb(null);
  });
}

module.exports = function identify(folder, cb) {
  if (folder[folder.length - 1] !== '/')
    folder += '/';

  async.series([isGit, isHg, isSvn],
  function(err, results) {
    if (err)
      return cb(err);
    return cb('No versioning system found');
  });
}
