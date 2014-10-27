var hg = require('./hg.js');
var git = require('./git.js');
var svn = require('./svn.js');
var identify = require('./identify.js');

var vizion = {};

vizion.analyze = function(argv, cb) {
  var _folder = (argv.folder != undefined) ? argv.folder : '.';

  identify(_folder, function(type, folder) {
    if (type === 'git')
      return git.parse(folder, cb);
    else if (type === 'hg')
      return hg.parse(folder, cb);
    else if (type === 'svn')
      return svn.parse(folder, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}

vizion.isUpToDate = function(argv, cb) {
  var _folder = (argv.folder != undefined) ? argv.folder : '.';

  identify(_folder, function(type, folder) {
    if (type === 'git')
      return git.isUpdated(folder, cb);
    // else if (type === 'hg')
    //   return hg.isUpdated(folder, cb);
    // else if (type === 'svn')
    //   return svn.isUpdated(folder, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}

vizion.update = function(argv, cb) {
  var _folder = (argv.folder != undefined) ? argv.folder : '.';

  identify(_folder, function(type, folder) {
    if (type === 'git')
      return git.update(folder, cb);
    // else if (type === 'hg')
    //   return hg.update(folder, cb);
    // else if (type === 'svn')
    //   return svn.update(folder, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}

vizion.revertTo = function(argv, cb) {
  var rev = (argv.revision) ? argv.revision : false;
  var _folder = (argv.folder != undefined) ? argv.folder : '.';

  if (!rev)
    return cb({msg: 'Cannot revert to an invalid commit revision', path: _folder});

  identify(_folder, function(type, folder) {
    if (type === 'git')
      return git.revert({folder: folder, revision: rev}, cb);
    // else if (type === 'hg')
    //   return hg.revert({folder: folder, revision: rev}, cb);
    // else if (type === 'svn')
    //   return svn.revert({folder: folder, revision: rev}, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}

vizion.prev = function(argv, cb) {
  var _folder = (argv.folder != undefined) ? argv.folder : '.';

  identify(_folder, function(type, folder) {
    if (type === 'git')
      return git.prev(folder, cb);
    // else if (type === 'hg')
    //   return hg.update(folder, cb);
    // else if (type === 'svn')
    //   return svn.update(folder, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}

vizion.next = function(argv, cb) {
  var _folder = (argv.folder != undefined) ? argv.folder : '.';

  identify(_folder, function(type, folder) {
    if (type === 'git')
      return git.next(folder, cb);
    // else if (type === 'hg')
    //   return hg.update(folder, cb);
    // else if (type === 'svn')
    //   return svn.update(folder, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}


module.exports = vizion;
