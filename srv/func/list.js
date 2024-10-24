const { parseMultipleParamsForDocPack } = require('./utils/utilities');
const { checkReadAllData, checkReadData } = require('./utils/scopes');
const transcoder = require('./utils/transcoders');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions (read all data or read specific data).
    if (checkReadAllData(request.req) || checkReadData(request.req)) {
        // Extract query parameters from the incoming request.
        let params = request.req.query,
            query = SELECT('*').from('DOC_LIST'), 
            whereConditions = [],
            aResults = [];

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
            aResults = await tx.run(query);

            let result = aResults.map(item => {
                item.JobId = item.JobId;
                item.FileName = item.FileName;
                item.DoxStatus = transcoder.doxStatus[item.Status] ? transcoder.doxStatus[item.Status] : null;
                item.DocumentType = transcoder.documentType[item.DocumentType] ? transcoder.documentType[item.DocumentType] : null;
                item.DocCategory = transcoder.docCategory[item.DocCategory] ? transcoder.docCategory[item.DocCategory] : null;
                item.IsMain = item.IsMain;
    
                return item;
            });

            // Return the result as a response, with status code, data, and message.
            return {
                status: 200,
                result: result,
                count: result.length,
                message: result.length == 0 ? 'No Data Found' : 'Executed',
            };

        } catch (err) {
            // Log any errors that occur during the query execution.
            console.error(`Error during query operation to 'doc_list': ${err}`);

            // Return a 500 Internal Server Error response in case of an error.
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
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