const { checkCommentScope } = require('./utils/scopes');
const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Validate incoming payload
    let { error } = schema.action_comment.validate(request.data.payload, { abortEarly: false });
    let valid = error == null;
    //If payload is valid then do assign
    if (valid) {
        // Extract payload data from the incoming request.
        let {
            PackageId,
            Subject,
            Note
        } = request.data.payload,
            createdBy = request.req.authInfo.getLogonName(),
            updatedBy = request.req.authInfo.getLogonName(),
            updatedAt = new Date(),
            createdAt = new Date(),
            data, query, updateDocPackQuery, insertDocPackNotesQuery;

        try {
            // Get SeqNo from DOC_PACK_NOTES
            query = SELECT(`IFNULL(max(SeqNo), 0) +1 AS SeqNo`).from(`DOC_PACK_NOTES`).where(`PACKAGEID = '${PackageId}'`).groupBy('PACKAGEID');
            data = await tx.run(query);
            let seqNo = data.length > 0 ? data[0].SeqNo : 1;
            // Defining insert query for doc_pack_notes table
            insertDocPackNotesQuery = INSERT.into('DOC_PACK_NOTES', { 'PackageId': PackageId, 'SeqNo': seqNo, 'Subject': Subject, 'Note': Note, 'CreatedBy': createdBy, 'CreatedAt': createdAt });
            // Execute the query and retrieve the data from the database.
            data = await tx.run(insertDocPackNotesQuery);

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
                message: `Note successfully created for package: ${PackageId}`
            };

        } catch (err) {
            // Log any errors that occur during the query execution.
            console.error(`Error during posting note operation: ${err}`);
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
