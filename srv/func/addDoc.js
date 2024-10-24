const { checkReadScope } = require('./utils/scopes');
const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkReadScope(request.req)) {
        // Validate incoming payload
        let { error } = schema.action_addDoc.validate(request.data.payload, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            // Extract payload data from the incoming request.
            let {
                PackageId,
                JobId,
                FileName,
                ObjectStoreRef
            } = request.data.payload,
                createdBy = request.req.user.id,
                updatedBy = request.req.user.id,
                updatedAt = new Date(),
                createdAt = new Date(),
                data, updateDocPackQuery, insertDocListQuery;

            try {
                // Defining insert query for doc_list table
                insertDocListQuery = INSERT.into('DOC_LIST', { 'PackageId': PackageId, 'JobId': JobId, 'ClientId': '', 'FileName': FileName, 'CreatedBy': createdBy, 'CreatedAt': createdAt, 'DocumentType': '', 'IsMain': false, 'DocCategory': '', 'Status': '', 'Flag': null, 'ModifiedBy': updatedBy, 'ModifiedAt': updatedAt, 'ObjectStoreRef': ObjectStoreRef, 'Confidence': 0, 'SupportingDoc': true });
                // Execute the query and retrieve the data from the database.
                data = await tx.run(insertDocListQuery);

                // Return the result with status code, number of affected rows as count, and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Insert failed'
                    };
                }

                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}'`)
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
                    status: 201,
                    message: `Document successfully added for package: ${PackageId}`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during adding document operation: ${err}`);
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
            target: 'Missing the read scope',
            status: 403
        };
    }
};
