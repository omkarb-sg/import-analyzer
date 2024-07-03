const path = require("path");
const { assert, warn } = require("../util/common");
const fs = require("fs");
const { parseAml } = require("../parsing/aml");

class Package {
	/**
	 *
	 * @param {import("./manifest").PackageInfo} packageInfo
	 */
	constructor(packageInfo) {
		/**
		 * @type {import("./manifest").PackageInfo}
		 */
		this.packageInfo = packageInfo;
		// Stored as itemtypefolder mapped to list of items as they are parsed
		// This can mean that a single AML file may produced multiple items (add/edit/etc)
		// Which AML file an item comes from is stored in Item object itself (TODO)
		/**
		 * @type {Object<string, import("../parsing/aml").Item[]>}
		 */
		this.items = {};
		/**
		 * @type {import("../parsing/aml").Item[]}
		 */
		this.addedItems = [];
		/**
		 * @type {import("../parsing/aml").Item[]}
		 */
		this.requiredItems = [];
	}

	/**
	 *
	 * @param {string} itemtypename
	 * @param {import("../parsing/aml").Item} item
	 */
	addItem(itemtypename, item) {
		if (this.items[itemtypename] instanceof Array) this.items[itemtypename].push(item);
		else this.items[itemtypename] = [item];
	}

	// To be called from outside when all items are added
	// TODO: make more efficient by removing duplicate removed and added items
	updateAddsReqs() {
		this.addedItems = [];
		this.requiredItems = [];
		/**
		 * @type {import("../parsing/aml").Item[]}
		 */
		const addedItems = [];
		/**
		 * @type {import("../parsing/aml").Item[]}
		 */
		const requiredItems = [];

		for (const itemtypename in this.items) {
			this.items[itemtypename].forEach((item) => {
				addedItems.push(...item.addedItems);
				requiredItems.push(...item.requiredItems);
			});
		}

		// Remove duplicates for Id only items and push
		addedItems.forEach((item) => {
			if (item.isPropertyItem()) {
				const itemExists = !!this.addedItems.find((_item) => {
					return _item.isPropertyItem() && _item.attributes["id"] === item.attributes["id"];
				});
				if (itemExists) return;
			}
			this.addedItems.push(item);
		});
		requiredItems.forEach((item) => {
			if (item.isPropertyItem()) {
				const itemExists = !!this.requiredItems.find((_item) => {
					return _item.isPropertyItem() && _item.attributes["id"] === item.attributes["id"];
				});
				if (itemExists) return;
			}
			this.requiredItems.push(item);
		});
	}

	validate() {
		this.addedItems.forEach((item) => {
			// warn(item.attributes["id"] != null, "Added item does not have ID");
			assert(item.attributes["type"] != null, "Added item does not have type");
		});
		this.requiredItems.forEach((item) => {
			assert(
				item.attributes["id"] != null ||
					item.attributes["action"] === "get" ||
					item.attributes["action"] === "edit",
				"Required item does not have ID or action of get or edit"
			);
			assert(item.attributes["type"] != null, "Required item does not have type");
		});
	}
}

/**
 *
 * @param {import("./manifest").ImportManifest} importManifest
 * @param {string} packageName
 * @returns {Package}
 */
function parsePackage(importManifest, packageName) {
	/**
	 * @type {import("./manifest").PackageInfo}
	 */
	const packageInfo = importManifest.getPackage(packageName);
	assert(packageInfo != null, "Cannot parse package that is not part of import manifest");

	/**
	 *
	 * @param {string} path
	 * @param {string} errormessage
	 * @returns {fs.Dir}
	 */
	const dirOpenHelper = (path, errormessage) => {
		let dir;
		try {
			dir = fs.opendirSync(path);
		} catch (e) {
			if (errormessage == null) return null;
			assert(false, errormessage);
		}
		return dir;
	};

	const manifestDirPath = importManifest.path.slice(0, importManifest.path.lastIndexOf(path.sep));
	const packageDir = dirOpenHelper(path.join(manifestDirPath, packageInfo.path));
	const package = new Package(packageInfo);

	let dirEntry = null;
	while ((dirEntry = packageDir.readSync())) {
		const itemtypename = dirEntry.name;
		const itemtypepath = path.join(dirEntry.path, dirEntry.name);
		warn(
			dirEntry.isDirectory() === true,
			`The directory ${itemtypepath} contains things other than directory: ${dirEntry.name}`
		);
		if (!dirEntry.isDirectory()) {
			continue;
		}

		// Read all files inside this itemtypepath
		const itemtypedir = fs.readdirSync(itemtypepath, { withFileTypes: true }).forEach((dirEntry) => {
			const filepath = path.join(dirEntry.path, dirEntry.name);
			const items = parseAml(filepath);
			items.forEach((item) => package.addItem(itemtypename, item));
		});
	}

	package.updateAddsReqs();
	package.validate();
	return package;
}

module.exports = {
	Package,
	parsePackage,
};
