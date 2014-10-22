var fs = require("fs");
var parseHg = require('./lib/hg.js');
var parseGit = require('./lib/git.js');
var parseSvn = require('./lib/svn.js');

module.exports.analyze = function analyze(argv, cb) {
	folder = (argv.folder != undefined) ? argv.folder : '.';

  if (folder[folder.length - 1] !== '/') {
    folder = folder + '/';
  }

  fs.exists(folder+'.git', function(exists) {
		if (exists) {
			return parseGit(folder, cb);
		}
    fs.exists(folder+'.hg', function(exists) {
		  if (exists) {
			  return parseHg(folder, cb);
		  }
      fs.exists(folder+'.svn', function(exists) {
		    if (exists) {
			    return parseSvn(folder, cb);
		    }
        else {
          return cb({
            msg : 'No versioning system found',
            path : folder
          });
        }
	    });
	  });
	});
}
