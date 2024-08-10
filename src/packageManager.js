const { parseManifestXml, ImportManifest } = require("./parsing/manifest");
const { parsePackage, Package } = require("./parsing/package");
const { Item } = require("./parsing/aml");
const { Aras } = require("./aras/aras");
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

	/**
	 * @typedef {Object<string, Item[]>} UnresolvedItemsResult
	 * From package name to list of items
	 */

	/**
	 * @returns {UnresolvedItemsResult}
	 */
	resolveInternally() {
		/**
		 * @type {UnresolvedItemsResult>}
		 */
		const unresolvedItems = {};
		for (let i = 0; i < this.packages.length; i++) {
			unresolvedItems[this.packages[i].packageInfo.name] = this._resolvePackageInternally(this.packages[i]);
		}
		return unresolvedItems;
	}

	/**
	 * If Unresolved Items are passed, only those are checked
	 * @param {Aras} aras
	 * @param {UnresolvedItemsResult} unresolvedItemsResult
	 * @returns {Promise<UnresolvedItemsResult>}
	 */
	async resolveExternally(aras, unresolvedItemsResult = null) {
		// Resolve externally everything
		if (unresolvedItemsResult == null) {
			/**
			 * @type {UnresolvedItemsResult>}
			 */
			const unresolvedItems = {};
			for (let i = 0; i < this.packages.length; i++) {
				unresolvedItems[this.packages[i].packageInfo.name] = await this._resolvePackageExternally(
					aras,
					this.packages[i]
				);
			}
			return unresolvedItems;
		}

		// Only resolve unresolvedItemsResult items
		const newUnresolvedItems = {};
		for (const packagename in unresolvedItemsResult) {
			let items = [];
			for (let i = 0; i < unresolvedItemsResult[packagename].length; i++) {
				if (!(await unresolvedItemsResult[packagename][i].isInAras(aras))) {
					items.push(unresolvedItemsResult[packagename][i]);
				}
			}
			newUnresolvedItems[packagename] = items;
		}
		return newUnresolvedItems;
	}

	/**
	 * @param {Package} pckage
	 * @returns {Item[]}
	 */
	_resolvePackageInternally(pckage) {
		const unresolvedItems = [];
		let ignoredEditItems = 0;
		pckage.requiredItems.forEach((item) => {
			// If property item, return true for OOTB properties
			if (
				item.attributes["type"] === "Property" &&
				item.attributes["action"] === "get" &&
				typeof item.properties["name"] === "string" &&
				// TODO: write all ootb properties here
				[
					"classification",
					"config_id",
					"created_by_id",
					"created_on",
					"css",
					"current_state",
					"generation",
					"id",
					"is_current",
					"is_released",
					"keyed_name",
					"locked_by_id",
					"major_rev",
					"managed_by_id",
					"minor_rev",
					"modified_by_id",
					"modified_on",
					"new_version",
					"not_lockable",
					"owned_by_id",
					"permission_id",
					"state",
					"team_id",
				].includes(item.properties["name"])
			) {
				// <Item type="Property" action="get">
				// 	<name>owned_by_id</name>
				// </Item>
				return;
			}

			// Ignore items with action="edit"
			if (item.attributes["action"] === "edit") {
				ignoredEditItems++; // TODO this variable is unused for now
				return;
			}

			let found = false;
			// Check in same package
			found = !!pckage.addedItems.find((addedItem) => addedItem.matches(item));
			if (found) return;

			// Check in depended packages
			for (let i = 0; i < pckage.packageInfo.dependson.length; i++) {
				const dependency = pckage.packageInfo.dependson[i];
				const dependedPackage = this.packages.find((_pckage) => {
					return _pckage.packageInfo.name === dependency;
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

	/**
	 * @param {Aras} aras
	 * @param {Package} pckage
	 * @returns {Promise<Item[]>}
	 */
	async _resolvePackageExternally(aras, pckage) {
		const unresolvedItems = [];
		for (let i = 0; i < pckage.requiredItems.length; i++) {
			const item = pckage.requiredItems[i];
			// Check if item is in database
			const isInAras = await item.isInAras(aras);
			if (!isInAras) {
				unresolvedItems.push(item);
			}
		}
		return unresolvedItems;
	}

	/**
	 *
	 * @param {Aras} aras
	 */
	async resolvePackageGroups(aras) {
		warn(false, "Package group resolution not implemented");
	}
}

module.exports = {
	PackageManager,
};
