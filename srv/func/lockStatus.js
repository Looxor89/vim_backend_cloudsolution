const { parseMultipleParamsForDocPack } = require('./utils/utilities');
const { checkReadAllData, checkReadData } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract query parameters from the incoming request.
    let params = request.req.query,
        query = SELECT('*').from('DOC_PACK'),
        whereConditions = [];

    try {
        // If there are parameters according with them define where conditions in order to get rows from doc_pack.
        if (Object.keys(params).length !== 0) {

            // Iterate through each parameter in the request query.
            for (let i in params) {
                let keys = parseMultipleParamsForDocPack(params[i]);

                // If the parameter contains a wildcard ('%'), use LIKE for partial matching.
                if (/\%/.test(keys)) {
                    for (let j in keys) {
                        whereConditions.push(`${i} LIKE ${keys[j]}`);
                    }
                } else {
                    // For non-wildcard parameters, use exact match with '='.
                    whereConditions.push(`${i} = ${keys.join()}`);
                }
            }
            // Concatenate where conditions
            query.where(whereConditions.join(' AND '));
        }

        // Execute the query and retrieve the data from the database.
        data = await tx.run(query);

        let result = {
            locked: data[0].LockedBy ? true : false,
            lockedBy: data[0].LockedBy ? data[0].LockedBy : null,
            lockedAt: data[0].LockedAt ? data[0].LockedAt : null
        };

        // Return the result as a response, with status code, data, and message.
        return {
            status: 200,
            currentUser: request.req.authInfo.getLogonName(),
            result: result
        };

    } catch (err) {
        // Log any errors that occur during the query execution.
        console.error(`Error during query operation to 'doc_pack': ${err}`);

        // Return a 500 Internal Server Error response in case of an error.
        return {
            status: 500,
            message: 'Internal server error'
        };
    }
};
