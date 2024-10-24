const { checkReadAllData, checkReadData } = require('./utils/scopes');
const currency = require('../resources/currency.json');

"use strict";

module.exports = async (request) => {
    // Check if the request has the necessary permissions (read all data or read specific data).
    if (checkReadAllData(request.req) || checkReadData(request.req)) {
            
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
    } else {
        // If the user does not have the necessary permissions, return a 403 Forbidden response.
        return {
            code: '403',
            message: 'Forbidden',
            target: 'Missing the read scope',
            status: 403
        };
    }
};
