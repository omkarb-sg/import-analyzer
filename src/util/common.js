/**
 * 
 * @param {boolean} assertion 
 * @param {string} message 
 */
function assert(assertion, message) {
    if (!assertion) {
        throw new Error(message);
    }
}

function warn(assertion, message) {
    if (!assertion) {
        console.log(`[WARN]: ${message}`);
    }
}

module.exports = {
    assert,
    warn
};