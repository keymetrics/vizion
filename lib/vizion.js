var ALL = {};
var vizion = {};

ALL.hg = require('./hg/hg');
ALL.git = require('./git/git');
ALL.svn = require('./svn/svn');
// Add more revision control tools here
var identify = require('./identify');

vizion.analyze = async function(argv, cb) {
  try {
    var _folder = (argv.folder !== undefined) ? argv.folder : '.';
    var { type, folder } = await identify(_folder);
    if (ALL[type]) {
      const result = await ALL[type].parse(folder);
      cb(null, result);
    } else {
      cb('Error vizion::analyze() for given folder: '+folder);
    }
  } catch (err) {
    cb(err);
  }
};

vizion.isUpToDate = async function(argv, cb) {
  try {
    var _folder = (argv.folder !== undefined) ? argv.folder : '.';
    var { type, folder } = await identify(_folder);
    if (ALL[type]) {
      const result = await ALL[type].isUpdated(folder);
      cb(null, result);
    } else{
      return cb('Error vizion::isUpToDate() for given folder: '+folder);
    }
  } catch (err) {
    cb(err);
  }
};

vizion.update = async function(argv, cb) {
  try {
    var _folder = (argv.folder !== undefined) ? argv.folder : '.';
    var { type, folder } = await identify(_folder);
    if (ALL[type]) {
      const result = await ALL[type].update(folder);
      cb(null, result);
    } else {
      return cb('Error vizion::update() for given folder: '+folder);
    }
  } catch (err) {
    cb(err);
  }
};

vizion.revertTo = async function(argv, cb) {
  try {
    var revision = (argv.revision) ? argv.revision : false;
    var _folder = (argv.folder !== undefined) ? argv.folder : '.';

    if (!(revision && /^[A-Fa-f0-9]+$/.test(revision))) return cb({msg: 'Cannot revert to an invalid commit revision', path: _folder});

    var { type, folder } = await identify(_folder);
    if (ALL[type]) {
      const result = await ALL[type].revert({folder: folder, revision: revision});
      cb(null, result);
    } else {
      return cb('Error vizion::analyze() for given folder: '+folder);
    }
  } catch (err) {
    cb(err);
  }
};

vizion.prev = async function(argv, cb) {
  try {
    var _folder = (argv.folder !== undefined) ? argv.folder : '.';
    var { type, folder } = await identify(_folder);
    if (ALL[type]) {
      const result = await ALL[type].prev(folder);
      cb(null, result);
    } else {
      return cb('Error vizion::prev() for given folder: '+folder);
    }
  } catch (err) {
    cb(err);
  }
};

vizion.next = async function(argv, cb) {
  try {
    var _folder = (argv.folder !== undefined) ? argv.folder : '.';
    var { type, folder } = await identify(_folder);
    if (ALL[type]) {
      const result = await ALL[type].next(folder);
      cb(null, result);
    } else {
      return cb('Error vizion::next() for given folder: '+folder);
    }
  } catch (err) {
    cb(err);
  }
};


module.exports = vizion;
