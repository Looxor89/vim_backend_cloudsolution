const { checkAssignScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {
    // Validate incoming payload
    let { error } = schema.action_assign.validate(request.data.payload, { abortEarly: false });
    let valid = error == null;
    //If payload is valid then do assign
    if (valid) {
        // Extract payload data from the incoming request.
        let {
            PackageId,
            AssignedTo
        } = request.data.payload,
            updatedBy = request.req.authInfo.getLogonName(),
            updatedAt = new Date(),
            lockedAt = moment().utc().format('YYYY-MM-DD HH:mm:ss'),
            data, query, updateDocPackQuery, insertDocWfQuery;

        try {
            // Defining update dock_pack query
            updateDocPackQuery = UPDATE('DOC_PACK')
                .set(`AssignedTo = '${AssignedTo}', Status = 'ASSIGN', ModifiedBy = '${updatedBy}', ModifiedAt = '${updatedAt}', LockedAt = '${lockedAt}'`)
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
            let note = `${updatedBy} assigned to ${AssignedTo}`;
            // Defining insert query for doc_wf table
            insertDocWfQuery = INSERT.into('DOC_WF', { 'PackageId': PackageId, 'SeqNo': seqNo, 'Action': 'ASSIGN', 'ActionAt': updatedAt, 'ActionBy': updatedBy, 'Note': note });
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
                message: `${PackageId} successfully assigned to user:${AssignedTo}`
            };

        } catch (err) {
            // Log any errors that occur during the query execution.
            console.error(`Error during assign operation: ${err}`);
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
