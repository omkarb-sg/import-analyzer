const { parseManifestXml } = require("./src/parsing/manifest");
const { readXml } = require("./src/xml/read");
const path = require("path");

const manifestPath = path.join(__dirname, "testexports/savetabs/imports.mf");

const importManifest = parseManifestXml(readXml(manifestPath));

