const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions (read all data or read specific data).
    if (checkReadScope(request.req)) {

        // Extract query parameters from the incoming request.
        let {
            jobId,
            $top
        } = request.req.query;

        let data, query;

        try {
            // Build a base query to select all fields from the 'V_DOC_EXTENDED' table.
            query = SELECT('*').from('DOC_EXTRACT').where(`JobId = '${jobId}'`).limit($top).orderBy({ SeqNo: 'desc' });

            // Execute the query and retrieve the data from the database.
            data = await tx.run(query);

            console.log('data IN DOC_EXTRACT', data.length);

            // Return the result as a response, with status code, data, and message.
            return {
                status: 200,
                result: data,
                count: data.length,
                message: data.length == 0 ? 'No Data Found' : 'Executed',
            };

        } catch (err) {
            // Log any errors that occur during the query execution.
            console.error(`Error during query operation to 'doc_extract': ${err}`);

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
