var expect = require('chai').expect;
var cliCommand = require("../../lib/cliCommand.js");

describe('Functional: cliCommand', function () {

    var folderWindows = "C:\\Program Files\\nodejs\\foobar";
    var folderUnix = "/etc/node/foobar";

    it("ok", function () {
        var target;

        if (/^win/.exec(process.platform))
            target = "cd \"" + folderWindows + "\" && git status -s";
        else
            target = "cd '" + folderUnix + "';LC_ALL=en_US.UTF-8 git status -s";

        var result = cliCommand(folderWindows, "git status -s");
        expect(target).to.eq(result);
    });

});
