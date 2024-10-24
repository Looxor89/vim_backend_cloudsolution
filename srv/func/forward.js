const { checkForwardScope } = require('./utils/scopes');
const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkForwardScope(request.req)) {
        // Validate incoming payload
        let { error } = schema.action_forward.validate(request.data.payload, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do forward
        if (valid) {
            // Extract payload data from the incoming request.
            let {
                PackageId,
                ForwardedTo
            } = request.data.payload,
                updatedBy = request.req.user.id,
                updatedAt = new Date(),
                data, query, updateDocPackQuery, insertDocWfQuery;

            try {
                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`Status = 'FORWARD', ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}'`)
                    .where(`PackageId = '${PackageId}'`);
                // Execute the query and retrieve the data from the database.
                data = await tx.run(updateDocPackQuery);

                // Return the result with status code, number of affected rows as count, and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Update failed'
                    };
                }

                // Get SeqNo from DOC_WF
                query = SELECT(`IFNULL(max(SeqNo), 0) +1 AS SeqNo`).from(`DOC_WF`).where(`PACKAGEID = '${PackageId}'`).groupBy('PACKAGEID');
                data = await tx.run(query);
                let seqNo = data[0].SeqNo;
                let note = `${updatedBy} forwarded to ${ForwardedTo}`;
                // Defining insert query for doc_wf table
                insertDocWfQuery = INSERT.into('DOC_WF', { 'PackageId': PackageId, 'SeqNo': seqNo, 'Action': 'FORWARD', 'ActionAt': updatedAt, 'ActionBy': updatedBy, 'Note': note });
                // Execute the query and retrieve the data from the database.
                data = await tx.run(insertDocWfQuery);

                // Return the result with status code, number of affected rows as count, and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Insert failed'
                    };
                }

                // Return the status code and message.
                return {
                    status: 201,
                    message: `${PackageId} successfully forwarded to user:${ForwardedTo}`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during assig operation: ${err}`);
                await tx.rollback(err);
                // Return a 500 Internal Server Error response in case of an error.
                return {
                    status: 500,
                    message: 'Internal server error'
                };
            }
        } else {
            console.error(error);
            // If the payload does not correct, return a 422 Invalid POST Payload.
            return {
                code: '422',
                message: 'Error',
                target: 'Invalid POST Payload',
                status: 422
            };

        }
    } else {
        // If the user does not have the necessary permissions, return a 403 Forbidden response.
        return {
            code: '403',
            message: 'Forbidden',
            target: 'Missing the assign scope',
            status: 403
        };
    }
};
