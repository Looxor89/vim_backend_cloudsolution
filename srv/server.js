/*eslint no-console: 0, no-unused-vars: 0*/
const xsenv = require('@sap/xsenv');
const cds = require("@sap/cds");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
cds.on("bootstrap", app => app.use(proxy()));
module.exports = cds.server;
xsenv.loadEnv(); //commentare quando si fa il deploy