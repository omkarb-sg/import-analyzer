require("dotenv").config();
const { PackageManager } = require("./src/packageManager");
const { Aras } = require("./src/aras/aras");

const manifestPath = String.raw`...\imports.mf`;

const run = async () => {
	const packageManager = new PackageManager(manifestPath);
	const unresolvedItemsResult1 = packageManager.resolveInternally();
	const aras = new Aras();
	await aras.authenticate();
	const unresolvedItemsResult2 = await packageManager.resolveExternally(aras, unresolvedItemsResult1);
	console.log(Object.values(unresolvedItemsResult2));
	console.log('...items unresolved');
};

run();
