var exec = require("child_process").exec;

var fs   = require("fs");

var halt = false;

function error(repoType, task, errorMsg, cb) {
	if (halt) return false;

	console.error("[Repo-Parser] An error occured while " + task + " in a " + repoType + " repository: " + errorMsg);
	halt = true;
  return cb("[Repo-Parser] An error occured while " + task + " in a " + repoType + " repository: " + errorMsg);
}

function checkReturn(dataArray, cb) {
	if (halt) {
		return false;
	}
	if (Object.keys(dataArray).length > 6) {
    Object.keys(dataArray).forEach(function(key) {
      if (typeof(dataArray[key]) === 'string') {
        dataArray[key] = dataArray[key].replace(/\n/g, '');
      }
    });
		cb(null, dataArray);
	}
};


module.exports.parse = function parseSvn(folder, cb) {
	var data = {};

  data.type = 'svn';
  data.commit_history = []; // temporary

	exec("cd '"+folder+"'; svn info | grep 'Repository Root' | awk '{print $NF}'", function(err, stdout, stderr) {
		if(err !== null) {
			error("subversion", "fetching path", stderr, cb);
		}
		else {
			data.url = stdout;
			checkReturn(data, cb);
		}
	});

	exec("cd '"+folder+"'; svn log -r COMMITTED", function(err, stdout, stderr) {
		if(err !== null) {
			error("subversion", "fetching log", stderr, cb);
		}
		else {
			var message = stdout.match(/^(r[0-9]+)\s\|/m);
			//date = stdout.match(/^date:\s+:([^\n]+)$/m);
			var summary = stdout.match(/lines?\s*\n((.|\n)*)\n-{72}\n$/);
			data.revision = message[1];
			data.comment = summary[1];
			//data.update_time = date;
			checkReturn(data, cb);
		}
	});
	exec("cd '"+folder+"'; svn info | sed -n \"/URL:/s/.*\\///p\"", function(err, stdout, stderr) {
		if(err !== null) {
			error("subversion", "fetching branch", stderr, cb);
		}
		else {
			data.branch = stdout;
			checkReturn(data, cb);
		}
	});
	fs.stat(folder+".svn", function(err, stats) {
		if(err !== null) {
			error("subversion", "fetching stats", "no error available", cb);
		}
		else {
			data.update_time = stats.mtime;
			checkReturn(data, cb);
		}
	});
}
