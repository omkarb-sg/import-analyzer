const { parseManifestXml } = require("./src/parsing/manifest");
const { parsePackage } = require("./src/parsing/package");

const manifestPath = "C:\\Users\\LP-T368\\Desktop\\ImportAnalyzer\\testexports\\someaddons\\imports.mf";
const importManifest = parseManifestXml(manifestPath);
const package = parsePackage(importManifest, importManifest.packages[0].name);
