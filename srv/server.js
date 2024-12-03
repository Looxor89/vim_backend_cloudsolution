/*eslint no-console: 0, no-unused-vars: 0*/
const xsenv = require('@sap/xsenv');
const cds = require("@sap/cds");
const express = require('express');
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
cds.on("bootstrap", app => {
    app.use(proxy());
    app.use(express.json({ limit: '50mb' })); // Adjust the limit as needed
});
module.exports = cds.server;
xsenv.loadEnv(); //commentare quando si fa il deploy