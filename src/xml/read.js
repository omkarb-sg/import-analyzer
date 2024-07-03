const fs = require("fs");
const DOMParser = new (require("jsdom").JSDOM)().window.DOMParser;

/**
 * Adds filepath property on returned document
 * @param {string} filepath
 * @returns {Document}
 */
function readXml(filepath) {
	const document = new DOMParser().parseFromString(fs.readFileSync(filepath, { encoding: "utf-8" }), "text/xml");
	document.filepath = filepath;
	return document;
}

module.exports = {
	readXml,
};
