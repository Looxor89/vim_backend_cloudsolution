
"use strict";

module.exports = async (request, tx) => {

    // Extract query parameters from the incoming request.
    let {
        headerId
    } = request.req.query;

    let data;

    try {// Execute the query and retrieve the data from the database.
        data = (await tx.run(
            SELECT('*').from('FatturaElettronicaBody').where({ header_Id: headerId })
        ))[0];

        // Return the result as a response, with status code, data, and message.
        return data;

    } catch (err) {

        // Return a 500 Internal Server Error response in case of an error.
        return {
            status: 500,
            message: 'Internal server error'
        };
    }
};
