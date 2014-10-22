var parseHg = require('./hg.js');
var parseGit = require('./git.js');
var parseSvn = require('./svn.js');
var identify = require('./identify.js');

module.exports.analyze = function(argv, cb) {
	folder = (argv.folder != undefined) ? argv.folder : '.';

  identify(folder, function(type) {
    if (type === 'git')
      return parseGit(folder, cb);
    else if (type === 'hg')
      return parseHg(folder, cb);
    else if (type === 'svn')
      return parseSvn(folder, cb);
    else
      return cb({
        msg : type,
        path : folder
      });
  });
}
