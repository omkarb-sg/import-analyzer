const { Item } = require("../parsing/aml");

/**
 *
 * @param {string} message
 * @param {Object<string, Item[]>} items
 */
function logItems(message, items) {
	console.log(message);
    const _items = {};
    for (const packagename in items) {
        _items[packagename] = items[packagename].map(item => JSON.parse(item.toString()));
        if (_items[packagename].length === 0) _items[packagename] = "None";
    }
	console.log((_items));
}

module.exports = {
	logItems,
};
