const { checkReadAllData, checkReadData } = require('./utils/scopes');
const currency = require('../resources/currency.json');

"use strict";

module.exports = async (request) => {

    // Extract query parameters from the incoming request.
    let { code } = request.req.query,
        aResults = [];

    if (code) {
        aResults.push(currency[code]);
    } else {
        for (const key in currency) {
            aResults.push(currency[key]);
        }
    }

    // Return the result as a response, with status code, data, and message.
    return {
        status: 200,
        result: aResults,
        count: aResults.length,
        message: aResults.length == 0 ? 'No Data Found' : 'Executed',
    };
};
