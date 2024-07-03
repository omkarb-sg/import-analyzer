const { parseManifestXml, ImportManifest } = require("./parsing/manifest");
const { parsePackage, Package } = require("./parsing/package");
const { assert, warn } = require("./util/common");

class PackageManager {
	/**
	 *
	 * @param {string} manifestFilepath
	 */
	constructor(manifestFilepath) {
		/**
		 * @type {ImportManifest}
		 */
		this.importManifest = parseManifestXml(manifestFilepath);
		/**
		 * @type {Package[]}
		 */
		this.packages = this.importManifest.packages.map((packageInfo) =>
			parsePackage(this.importManifest, packageInfo.name)
		);
	}

	resolveInternally() {
		/**
		 * @type {Object<string, import("./parsing/aml").Item[]>}
		 */
		const unresolvedItems = {};
		for (let i = 0; i < this.packages.length; i++) {
			unresolvedItems[this.packages[i].packageInfo.name] = this._resolvePackageInternally(this.packages[i]);
		}
        return unresolvedItems;
	}

	/**
	 * @param {Package} pckage
	 * @returns {import("./parsing/aml").Item[]}
	 */
	_resolvePackageInternally(pckage) {
		const unresolvedItems = [];
		pckage.requiredItems.forEach((item) => {
			let found = false;
			// Check in same package
			found = !!pckage.addedItems.find((addedItem) => addedItem.matches(item));
			if (found) return;

			// Check in depended packages
			for (let i = 0; i < pckage.packageInfo.dependson.length; i++) {
				const dependency = pckage.packageInfo.dependson[i];
				const dependedPackage = this.packages.find((_pckage) => {
					_pckage.packageInfo.name === dependency;
				});
				// warn(dependedPackage != null, `Cannot find dependency ${dependency} in parsed packages`);
				found = !!dependedPackage?.addedItems.find((addedItem) => addedItem.matches(item));
				break;
			}
			if (found) return;
			unresolvedItems.push(item);
		});

		return unresolvedItems;
	}
}

module.exports = {
	PackageManager,
};
