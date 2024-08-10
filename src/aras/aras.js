const fetch = require("node-fetch");
const { assert } = require("../util/common");
const { readXml } = require("../xml/read");

/**
 * @typedef ArasAuthResponse
 * @property {string} access_token
 * @property {Date} expires_at
 * @property {string} scope
 */

class Aras {
	constructor() {
		/**
		 * @type {ArasAuthResponse}
		 * */
		this.authResponse = null;
	}

	async authenticate() {
		console.log("Authenticating...");
		const response = await fetch(process.env.TOKEN_URL, {
			method: "POST",
			body: new URLSearchParams({
				username: process.env.ARAS_USERNAME,
				password: process.env.ARAS_PASSWORD,
				client_id: "IOMApp",
				database: process.env.ARAS_DATABASE,
				grant_type: "password",
				scope: "Innovator",
			}),
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		});

		const data = await response.json();
		assert(data.error == null, data.error + " " + data.error_description);
		this.authResponse = data;
		return this;
	}

	/**
	 *
	 * @param {string} aml
	 * @returns {Promise<string>}
	 */
	async applyAML(aml) {
		// assert(this.authResponse != null, "Aras object not authenticated");
		if (this.authResponse == null) {
			await this.authenticate();
		}

		const response = await fetch(process.env.INNOVATOR_SERVER_URL, {
			method: "POST",
			body: aml,
			headers: {
				Soapaction: "ApplyAML",
				"Content-Type": "text/xml",
				Authorization: `Bearer ${this.authResponse.access_token}`,
			},
		});
		return response.body.read().toString();
	}

	/**
	 * Pass in what you obtain from applyAML
	 * @param {string} response
	 * @returns {boolean}
	 */
	isFault(response) {
		const doc = readXml(null, response);
		const result = doc.querySelector("Result");
		const fault = doc.querySelector("Fault");
		if (result && fault) {
			assert(false, "Response contains both Result and Fault");
		}
		return !!fault;
	}
}

module.exports = {
	Aras,
};
