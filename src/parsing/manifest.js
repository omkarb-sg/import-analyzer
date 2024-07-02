const { assert } = require("../util/common");
const { readXml } = require("../xml/read");

/**
 * @typedef {Object} PackageInfo
 * @property {string} name
 * @property {string} path
 * @property {string[]} dependson
 */

class ImportManifest {
	constructor() {
		/**
		 * @type {PackageInfo[]}
		 */
		this.packages = [];
		/**
		 * @type {string | null}
		 */
		this.path = null;
	}

	/**
	 *
	 * @param {string} name
	 * @returns {PackageInfo | null}
	 */
	getPackage(name) {
		return this.packages.find(
			(existingPackageInfo) => existingPackageInfo.name.toLocaleLowerCase() === name.toLocaleLowerCase()
		);
	}

	/**
	 *
	 * @param {string} name
	 */
	addPackage(name, path) {
		if (this.getPackage(name) == null) {
			this.packages.push({ name, path, dependson: [] });
		}
	}

	/**
	 *
	 * @param {string} frompackagename
	 * @param {string} topackagename
	 */
	addDependency(frompackagename, topackagename) {
		const frompackage = this.getPackage(frompackagename);
		assert(frompackage != null, "From package doesn't exist");
		assert(
			frompackage.dependson.find((dependency) => dependency.toLocaleLowerCase() == topackagename) == null,
			"Dependency already exists"
		);
		frompackage.dependson.push(topackagename);
	}
}

/**
 * @param {Document} manifestXml
 * @returns {ImportManifest}
 */
function parseManifestXml(filepath) {
	const manifestXml = readXml(filepath);

	// Parse Xml
	const importsNode = manifestXml.children[0];
	assert(manifestXml.childElementCount === 1, "Invalid manifest, Expected single root element");
	assert(importsNode.tagName === "imports", "Invalid manifest, Expected imports tag");
	const packageInfos = [];
	for (let i = 0; i < importsNode.childElementCount; i++) {
		const packageNode = importsNode.children[i];
		assert(packageNode.tagName === "package", "Invalid manifest, Expected package tag");
		const packageInfo = { name: undefined, path: undefined, dependson: [] };
		packageInfo.name = packageNode.getAttribute("name");
		packageInfo.path = packageNode.getAttribute("path");
		for (let j = 0; j < packageNode.childElementCount; j++) {
			const dependsonNode = packageNode.children[j];
			assert(dependsonNode.tagName === "dependson", "Invalid manifest, Expected dependson tag");
			packageInfo.dependson.push(dependsonNode.getAttribute("name"));
		}
		packageInfos.push(packageInfo);
	}

	// Instantiate ImportManifest
	const importManifest = new ImportManifest();
	for (const packageInfo of packageInfos) {
		importManifest.addPackage(packageInfo.name, packageInfo.path);
	}
	for (const packageInfo of packageInfos) {
		packageInfo.dependson.forEach((dependency) => importManifest.addDependency(packageInfo.name, dependency));
	}
	importManifest.path = filepath;

	return importManifest;
}

module.exports = {
	parseManifestXml,
	ImportManifest,
};
