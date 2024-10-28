const { checkWriteScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkWriteScope(request.req)) {
        // Validate incoming payload
        let { error } = schema.action_reject.validate(request.data.payload, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            // Extract payload data from the incoming request.
            let {
                PackageId,
                sMode
            } = request.data.payload,
                updatedBy = request.req.authInfo.getLogonName(),
                updatedAt = new Date(),
                lockedAt = moment().utc().format('YYYY-MM-DD HH:mm:ss'),
                data, updateDocPackQuery;
            
            if (sMode === null) {
                sMode = 'REJRTV';
            }

            try {
                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`Status = '${sMode}', ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}', LockedAt = '${lockedAt}'`)
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

                // Return the status code and message.
                return {
                    status: 200,
                    message: `${PackageId} successfully rejected with this status: ${sMode}`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during reject operation: ${err}`);
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
                target: 'Invalid query',
                status: 422
            };

        }
    } else {
        // If the user does not have the necessary permissions, return a 403 Forbidden response.
        return {
            code: '403',
            message: 'Forbidden',
            target: 'Missing the write scope',
            status: 403
        };
    }
};
