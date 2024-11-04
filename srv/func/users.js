const { parseMultipleParamsForDocPack } = require('./utils/utilities');
const { checkReadAllData, checkReadData } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {

    // Extract query parameters from the incoming request.
    let params = request.req.query;

    console.log("REQUEST: ", request.req);
    console.log('params ', params);

    let data, query, whereConditions = [];

    try {
        // Build a base query to select all fields from the 'AP_USERS' table.
        query = SELECT('*').from('AP_USERS');

        // If there are parameters present in the request, proceed to process each one.
        if (params != null && Object.keys(params).length > 0) {

            // Iterate through each parameter in the request query.
            for (let i in params) {
                // Handle generic filters for other parameters.
                let keys = parseMultipleParamsForDocPack(params[i]);

                // If the parameter contains a wildcard ('%'), use LIKE for partial matching.
                if (/\%/.test(keys)) {
                    for (let j in keys) {
                        // Apply LIKE for partial matching on other parameters.
                        whereConditions.push(`${i} LIKE ${keys[j]}`);
                    }
                } else {
                    // For non-wildcard parameters, use exact match with '='.
                    whereConditions.push(`${i} IN (${keys.join()})`);
                }

            }

            // If there are any conditions, append them to the query.
            if (whereConditions.length > 0) {
                query.where(whereConditions.join(' AND '));
            }
        }

        console.log('QUERY', query);
        console.log('WHERE CONDITIONS', whereConditions);

        // Execute the query and retrieve the data from the database.
        data = await tx.run(query);

        console.log('data in AP_USERS', data.length);

        // Return the result as a response, with status code, data, and message.
        return {
            status: 200,
            result: data,
            count: data.length,
            message: data.length == 0 ? 'No Data Found' : 'Executed',
        };

    } catch (err) {
        // Log any errors that occur during the query execution.
        console.error(`Error during query operation to 'AP_USERS': ${err}`);

        // Return a 500 Internal Server Error response in case of an error.
        return {
            status: 500,
            message: 'Internal server error'
        };
    }
};
