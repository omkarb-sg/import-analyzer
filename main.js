const { PackageManager } = require("./src/packageManager");
const packageManager = new PackageManager(
	String.raw`C:\Users\LP-T368\Desktop\ImportAnalyzer\testexports\someaddons\imports.mf`
);
console.log(packageManager.packages);
