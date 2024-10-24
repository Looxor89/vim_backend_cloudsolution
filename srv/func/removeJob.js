const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Validate incoming payload
    let { error } = schema.action_removeJob.validate(request.data.payload, { abortEarly: false });
    let valid = error == null;
    //If payload is valid then do assign
    if (valid) {
        // Extract payload data from the incoming request.
        let {
            PackageId,
            JobId,
            Mode
        } = request.data.payload,
            updatedBy = request.req.user.id,
            updatedAt = new Date(),
            data, query, updateDocListQuery;

        try {
            // Get record from DOC_EXTRACT
            query = SELECT(`*`).from(`DOC_EXTRACT`).where(`JobId = '${JobId}'`);
            data = await tx.run(query);


            // Defining update dock_list query
            updateDocListQuery = UPDATE('DOC_LIST')
                .set(`DocCategory = '${Mode}', ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}'`)
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
};
