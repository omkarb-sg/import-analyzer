require("dotenv").config();
const { PackageManager } = require("./src/packageManager");
const { Aras } = require("./src/aras/aras");
const config = require("./config");
const { logItems } = require("./src/output/logItems");

// Or give a path here instead of commandline args
const manifestPath = process.argv[2] || String.raw`.\export\imports.mf`;
const aras = new Aras();

const run = async () => {
	const packageManager = new PackageManager(manifestPath);
	const unresolvedItemsResult1 = packageManager.resolveInternally();
	if (config.showInternalUnresolved) logItems("--- Unresolved Internally ---", unresolvedItemsResult1);
	if (config.showExternalUnresolved) {
		const unresolvedItemsResult2 = await packageManager.resolveExternally(aras, unresolvedItemsResult1);
		logItems("--- Unresolved Externally ---", unresolvedItemsResult2);
	}
};

run();
