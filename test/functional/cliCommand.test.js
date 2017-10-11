var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var ini = require('ini');

var cliCommand = require("../../lib/cliCommand.js");

describe('Unit: cliCommand', function () {

    describe("getPlatform", function () {

        var tmp = process.platform;

        before(function () {
            process.platform = "win32";
        });

        it("recognizes win32/64 systems", function () {
            var r1 =
        });

        after(function () {
            process.platform = tmp;
        });

        it("decides on Unix for all other systems", function () {

        });
    });

});
