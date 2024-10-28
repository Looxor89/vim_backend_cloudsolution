const { checkWriteScope } = require('./utils/scopes');
const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkWriteScope(request.req)) {
        // Validate incoming payload
        let { error } = schema.action_setMainJob.validate(request.data.payload, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            // Extract payload data from the incoming request.
            let {
                PackageId,
                JobId
            } = request.data.payload,
                updatedBy = request.req.authInfo.getLogonName(),
                updatedAt = new Date(),
                data,
                updateDocListQuery;

            try {
                // Defining update dock_list query for remove main job
                updateDocListQuery = UPDATE('DOC_LIST')
                    .set(`IsMain = ${false}, SupportingDoc = ${false}, ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}'`)
                    .where(`PackageId = '${PackageId}'`);
                // Execute the query and retrieve the data from the database.
                data = await tx.run(updateDocListQuery);

                // Return the result with status code, number of affected rows as count, and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Update failed'
                    };
                }

                // Defining update dock_list query for set main job
                updateDocListQuery = UPDATE('DOC_LIST')
                    .set(`IsMain = ${true}, ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}'`)
                    .where(`PackageId = '${PackageId}' AND JobId = '${JobId}'`);
                // Execute the query and retrieve the data from the database.
                data = await tx.run(updateDocListQuery);

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
                    status: 201,
                    message: `DOC_LIST with PackageId ${PackageId} and JobID ${PackageId} successfully updated`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during remove job operation: ${err}`);
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
            target: 'Missing the write scope',
            status: 403
        };
    }
}
