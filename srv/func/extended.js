const { parseMultipleParamsForDocPack } = require('./utils/utilities');
const { checkReadAllData, checkReadData } = require('./utils/scopes');
const transcoder = require('./utils/transcoders');

"use strict";

module.exports = async (request, tx) => {

    // Extract query parameters from the incoming request.
    let params = request.req.query;

    // Extract pagination parameters ($top and $skip)
    const top = parseInt(params.$top) || 10;   // Default value for $top is 10
    const skip = parseInt(params.$skip) || 0;  // Default value for $skip is 0

    // If the user has permission to read specific data, set 'ASSIGNEDTO' to the user's ID.
    if (checkReadData(request.req)) {
        params.ASSIGNEDTO = request.req.authInfo.getLogonName();
    }

    console.log("REQUEST: ", request.req);
    console.log('params ', params);

    let data, query, whereConditions = [];

    try {
        // Build a base query to select all fields from the 'V_DOC_EXTENDED' table.
        query = SELECT('*').from('V_DOC_EXTENDED').limit(top, skip);

        // If there are parameters present in the request, proceed to process each one.
        if (params != null && Object.keys(params).length > 0) {

            // Iterate through each parameter in the request query.
            for (let i in params) {
                if (i !== '$top' && i !== '$skip') {
                    if (i === 'ASSIGNEDTO') {
                        // Handle 'ASSIGNEDTO' parameter (filter for documents assigned to the user).
                        let keys = parseMultipleParamsForDocPack(params[i]);
                        whereConditions.push(`${i} LIKE ${keys[0]} OR (ACTION = 'FORWARD' AND ACTIONBY LIKE ${keys[0]})`);

                    } else if (i === 'CREATEDAT' || i === 'MODIFIEDAT') {
                        // Handle date range parameters ('CREATEDAT' and 'MODIFIEDAT').
                        let paramValues = params[i].split(',');
                        whereConditions.push(`${i} BETWEEN '${paramValues[0]}' AND '${paramValues[1]}'`);

                    } else if (i === 'ISMAIN') {
                        // Handle 'ISMAIN' parameter (whether the document is the main one).
                        let paramValues = params[i].split(',');
                        whereConditions.push(`${i} = ${paramValues.join()}`);

                    } else if (i === 'DOC_STATUS') {
                        // Handle 'DOC_STATUS' parameter (the status of the document).
                        let docstat = [];
                        let paramValues = params[i].split(',');
                        for (let j = 0; j < paramValues.length; j++) {
                            docstat.push(`${i} = '${paramValues[j]}'`);
                        }
                        whereConditions.push(`(${docstat.join(' OR ')})`);

                    } else {
                        // Handle generic filters for other parameters.
                        let keys = parseMultipleParamsForDocPack(params[i]);

                        // If the parameter contains a wildcard ('%'), use LIKE for partial matching.
                        if (/\%/.test(keys)) {
                            for (let j in keys) {
                                if (i === 'DOCCATEGORY') {
                                    // Special handling for 'DOCCATEGORY'.
                                    whereConditions.push(`${i} = ${keys[j]}`);
                                } else {
                                    // Apply LIKE for partial matching on other parameters.
                                    whereConditions.push(`${i} LIKE ${keys[j]}`);
                                }
                            }
                        } else {
                            // For non-wildcard parameters, use exact match with '='.
                            whereConditions.push(`${i} = ${keys.join()}`);
                        }
                    }
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
        console.log('data IN DOC_PACK', data.length);
        // Transcode values
        let aData = data.map(item => {
            item.DOCCATEGORY = transcoder.docCategory[item.DOCCATEGORY];
            return item;
        });

        // Return the result as a response, with status code, data, and message.
        return {
            status: 200,
            result: aData,
            count: aData.length,
            message: aData.length == 0 ? 'No Data Found' : 'Executed',
        };

    } catch (err) {
        // Log any errors that occur during the query execution.
        console.error(`Error during query operation to 'extended': ${err}`);

        // Return a 500 Internal Server Error response in case of an error.
        return {
            status: 500,
            message: 'Internal server error'
        };
    }
};
