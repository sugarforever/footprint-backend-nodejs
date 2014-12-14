var assert = require("assert")
var footprintModule = require("../footprint_module")

describe("footprint_module", function() {
	describe("#getFileNameAndExtension()", function() {
		it("should return 1 as file name and txt as extension", function() {
			var result = footprintModule.getFileNameAndExtension("1.txt");
			assert.equal("1", result.fileName);
			assert.equal("txt", result.ext);	
		})
	})
});