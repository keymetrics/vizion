var fs = require('fs');
var async = require('async');

module.exports = function(folder, cb) {
  if (folder[folder.length - 1] !== '/')
    folder += '/';

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

  async.series([isGit, isHg, isSvn], function(err, results) {
    if (err !== null)
      return cb(err, folder);
    return cb('No versioning system found', folder);
  });
}
