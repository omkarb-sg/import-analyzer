const { PackageManager } = require("./src/packageManager");
const packageManager = new PackageManager(
	String.raw`C:\Users\LP-T368\Desktop\ImportAnalyzer\testexports\someaddons\imports.mf`
);
const unresolvedItems = packageManager.resolveInternally();
for (const packagename in unresolvedItems) {
    unresolvedItems[packagename].forEach(item => console.log(`Unresolved package ${packagename}: ${item.attributes["type"]} ${item.attributes["id"]}`))
}