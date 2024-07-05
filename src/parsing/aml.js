const { Aras } = require("../aras/aras");
const { assert, warn } = require("../util/common");
const { readXml } = require("../xml/read");

class Item {
	/**
	 *
	 * @param {Element} xmlNode
	 */
	constructor(xmlNode) {
		/**
		 * @type {Element}
		 */
		this.xmlNode = xmlNode;
		this.attributes = {};
		this.properties = {};
		/**
		 * @type {Item[]}
		 */
		this.relationships = [];

		/**
		 * @type {Item[]}
		 */
		this.addedItems = [];
		/**
		 * @type {Item[]}
		 */
		this.requiredItems = [];

		if (this.xmlNode.tagName === "Item") {
			this.populate();
		} else {
			this.populatePropertyItem();
		}
		this.updateAddsReqs();
	}

	populate() {
		assert(this.xmlNode.tagName === "Item", "Invalid Item XML, Expected Item tag");
		this.attributes = {};
		this.properties = [];
		this.relationships = [];
		// Parse attributes
		for (let i = 0; i < this.xmlNode.attributes.length; i++) {
			this.attributes[this.xmlNode.attributes[i].name] = this.xmlNode.attributes[i].value;
		}
		// Parse properties
		for (let i = 0; i < this.xmlNode.childElementCount; i++) {
			// Relationships
			if (this.xmlNode.children[i].tagName === "Relationships") {
				for (let j = 0; j < this.xmlNode.children[i].childElementCount; j++) {
					const relationshipItemNode = this.xmlNode.children[i].children[j];
					const relationshipItem = new Item(relationshipItemNode);
					// Not necessary if exported via export tool, but is necessary to follow AML rules
					relationshipItem.properties["source_id"] = this;
					this.relationships.push(relationshipItem);
				}
				continue;
			}
			// Property Item
			if (this.xmlNode.children[i].childElementCount === 1) {
				const propertyItemNode = this.xmlNode.children[i].children[0];
				assert(propertyItemNode.tagName === "Item", "Invalid AML, Property contains node other than Item");
				const propertyItem = new Item(propertyItemNode);
				this.properties[this.xmlNode.children[i].tagName] = propertyItem;
				continue;
			}
			if (this.xmlNode.children[i].childElementCount > 1) {
				assert(false, "Invalid AML, Property can have at most one child node");
			}
			// Property which is an ID
			if (this.xmlNode.children[i].getAttribute("type") != null) {
				this.properties[this.xmlNode.children[i].tagName] = new Item(this.xmlNode.children[i]);
				continue;
			}
			// Normal property value
			this.properties[this.xmlNode.children[i].tagName] = this.xmlNode.children[i].innerHTML;
		}
	}

	populatePropertyItem() {
		this.attributes = {};
		this.properties = [];
		this.relationships = [];
		assert(this.xmlNode.childElementCount === 0, "Invalid AML, Property Item has xml children");
		// Parse attributes
		for (let i = 0; i < this.xmlNode.attributes.length; i++) {
			this.attributes[this.xmlNode.attributes[i].name] = this.xmlNode.attributes[i].value;
		}
		this.attributes["id"] = this.xmlNode.innerHTML;
	}

	isPropertyItem() {
		return this.xmlNode.tagName !== "Item";
	}

	updateAddsReqs() {
		const addedItems = [];
		const requiredItems = [];

		if (this.attributes["action"]?.toLowerCase() === "add") {
			addedItems.push(this);
		}
		if (
			this.isPropertyItem() ||
			this.attributes["action"]?.toLowerCase() === "get" ||
			this.attributes["action"] === "edit"
		) {
			requiredItems.push(this);
		}
		// Items from properties
		for (const property in this.properties) {
			if (!(this.properties[property] instanceof Item)) continue;
			/**
			 * @type {Item}
			 */
			const propertyItem = this.properties[property];
			addedItems.push(...propertyItem.addedItems);
			requiredItems.push(...propertyItem.requiredItems);
		}

		// Items from relationships
		for (const relationshipItem of this.relationships) {
			addedItems.push(...relationshipItem.addedItems);
			requiredItems.push(...relationshipItem.requiredItems);
		}
		this.addedItems = addedItems;
		this.requiredItems = requiredItems;
	}

	/**
	 * Other item is ideally one of the required items. This item will return
	 * true if this item satisfies that required item.
	 *
	 * Please only call this on an added item.
	 * @param {Item} otherItem
	 * @returns {boolean}
	 */
	matches(otherItem) {
		if (otherItem.attributes["action"] === "get") {
			assert(otherItem.attributes["id"] == null, "Unexpected, Item with action get has an attribute for ID");
			assert(otherItem.relationships.length === 0, "Required item has relationships, too complex for me sorry");
			// Other item's properties must match
			for (const propertyname in otherItem.properties) {
				let otherPropertyValue = otherItem.properties[propertyname];
				let thisPropertyValue = this.properties[propertyname];
				if (otherPropertyValue instanceof Item) {
					assert(
						otherPropertyValue.attributes["action"] != "get",
						"Item with property action get, has nested property item with action get"
					);
					otherPropertyValue = otherPropertyValue.attributes["id"];
				}
				if (thisPropertyValue instanceof Item) {
					// If thisPropertyValue is get item, thisItem can not resolve otherItem
					// thisPropertyValue id will be undefined and will return false
					thisPropertyValue = thisPropertyValue.attributes["id"];
				}
				if (otherItem.properties[propertyname] !== this.properties[propertyname]) {
					return false;
				}
			}
			return true;
		}
		// Item resolution for items with `edit` attribute is TODO
		return (
			this.attributes["id"] === otherItem.attributes["id"] &&
			this.attributes["type"] === otherItem.attributes["type"]
		);
	}

	/**
	 * @param {Aras} aras
	 */
	async isInAras(aras) {
		// TODO: Can not resolve edit items
		if (this.attributes["action"] === "edit") {
			return false;
		}

		// If property item
		if (this.isPropertyItem()) {
			const type = this.attributes["type"];
			const id = this.attributes["id"];
			const response = await aras.applyAML(
				`<AML><Item type="${type}" action="get" select="id" id="${id}"></Item></AML>`
			);
			return !aras.isFault(response);
		}

		// Get item
		assert(this.attributes["action"] === "get", "action must be get if not propertyitem or edit");
		const aml = [];
		aml.push("<AML>");
		aml.push(this.xmlNode.outerHTML);
		aml.push("</AML>");
		const response = await aras.applyAML(aml.join('\n'));
		return !aras.isFault(response);
	}

	getFileName() {
		return this.xmlNode.ownerDocument.filepath;
	}
}

/**
 *
 * @param {string} filepath
 * @returns {Item[]}
 */
function parseAml(filepath) {
	const xmlDocument = readXml(filepath);
	assert(xmlDocument.children.length === 1, "Invalid Xml, Only one tag should be at root level");
	assert(xmlDocument.children[0].tagName === "AML", "Invalid Xml, AML tag expected");
	const items = [];
	for (let i = 0; i < xmlDocument.children[0].childElementCount; i++) {
		const itemNode = xmlDocument.children[0].children[i];
		assert(itemNode.tagName === "Item", "Invalid AML, Item tag expected");
		const item = new Item(itemNode);
		items.push(item);
	}
	return items;
}

module.exports = {
	Item,
	parseAml,
};
