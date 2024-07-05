require("dotenv").config();
const { Aras } = require("./src/aras/aras");

const run = async () => {
	const aras = new Aras();
	await aras.authenticate();
	const response = await aras.applyAML(`
<AML>
	<Item type="ItemType" action="get" select="*">
		<name>ItemType</name>
	</Item>
</AML>
	`);
	console.log(aras.isFault(response));
};

run();
