const fs = require("fs");
const DOMParser = new (require("jsdom").JSDOM)().window.DOMParser;

/**
 *
 * @param {string} filepath
 */
function readXml(filepath) {
	return new DOMParser().parseFromString(fs.readFileSync(filepath, { encoding: "utf-8" }), "text/xml");
}

module.exports = {
	readXml,
};
