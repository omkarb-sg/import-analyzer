require("dotenv").config();
const { PackageManager } = require("./src/packageManager");
const { Aras } = require("./src/aras/aras");

const manifestPath = String.raw`...\imports.mf`;

const run = async () => {
	const packageManager = new PackageManager(manifestPath);
	const unresolvedItemsResult1 = packageManager.resolveInternally();
	console.log(Object.values(unresolvedItemsResult1).length + " items unresolved internally");
	const aras = new Aras();
	await aras.authenticate();
	const unresolvedItemsResult2 = await packageManager.resolveExternally(aras, unresolvedItemsResult1);
	console.log("Unresolved:");
	Object.values(unresolvedItemsResult2).forEach((items) =>
		items
			.filter((item) => item.attributes["action"] !== "edit")
			.forEach((item) => {console.log(item.xmlNode.outerHTML);console.log()})
	);
	packageManager.resolvePackageGroups(aras);
};

run();
