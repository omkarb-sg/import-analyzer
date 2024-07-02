const { parseManifestXml, ImportManifest } = require("./parsing/manifest");
const { parsePackage, Package } = require("./parsing/package");

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
}

module.exports = {
	PackageManager,
};
