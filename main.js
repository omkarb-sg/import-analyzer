const { PackageManager } = require("./src/packageManager");
const packageManager = new PackageManager(
	String.raw``
);
const unresolvedItems = packageManager.resolveInternally();
for (const packagename in unresolvedItems) {
	unresolvedItems[packagename].forEach((item) =>
		console.log(
			`Unresolved item ${packagename}: ${item.attributes["type"]} ${
				item.attributes["id"] || item.attributes["action"]
			}`
		)
	);
}
