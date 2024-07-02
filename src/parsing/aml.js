const { assert } = require("../util/common");
const { readXml } = require("../xml/read");

class Item {
	/**
	 * @typedef {Object} AlternativeItemParams
	 * @property {string} type
	 * @property {string} id
	 *
	 * @param {Element} xmlNode
	 * @param {AlternativeItemParams} alternativeItemParams
	 */
	constructor(xmlNode, alternativeItemParams) {
		/**
		 * @type {Element}
		 */
		this.xmlNode = xmlNode;
		this.attributes = {};
		this.properties = [];
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

		if (this.xmlNode != null) {
			this.populate();
		} else {
			this.attributes["type"] = alternativeItemParams.type;
			this.attributes["id"] = alternativeItemParams.id;
			this.properties["id"] = alternativeItemParams.id;
		}
		this.updateAddsReqs();
	}

	populate() {
		assert(this.xmlNode.tagName === "Item", "Invalid Item XML, Expected Item tag");
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
				const propertyType = this.xmlNode.children[i].getAttribute("type");
				const propertyId = this.xmlNode.children[i].innerHTML;
				this.properties[this.xmlNode.children[i].tagName] = new Item(null, {
					type: propertyType,
					id: propertyId,
				});
				continue;
			}
			// Normal property value
			this.properties[this.xmlNode.children[i].tagName] = this.xmlNode.children[i].innerHTML;
		}
	}

	isIdOnly() {
		return this.xmlNode == null;
	}

	updateAddsReqs() {
		const addedItems = [];
		const requiredItems = [];

		if (this.attributes["action"]?.toLowerCase() === "add") {
			addedItems.push(this);
		}
		if (
			this.isIdOnly() ||
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
