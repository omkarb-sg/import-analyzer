const { parseAml } = require("./src/parsing/aml");
const path = require("path");

const items = parseAml("testexports\\OLM_user_exit\\employee\\Import\\CommandBarSection\\sg_employe_transfer_owernship.xml")
console.log(items);
