const { checkAssignScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {
    // Validate incoming payload
    let { error } = schema.action_assign.validate(request.data.payload, { abortEarly: false });
    let valid = error == null;
    //If payload is valid then do assign
    if (!valid) {
        console.error(error);
        // If the payload does not correct, return a 422 Invalid POST Payload.
        throw new Error({
            code: '422',
            message: 'Error',
            target: 'Invalid POST Payload',
            status: 422
        });
    }

    // Extract payload data from the incoming request.
    let {
        PackagesId,
        AssignedTo
    } = request.data.payload,
        updatedBy = request.req.authInfo.getLogonName(),
        updatedAt = new Date(),
        data, query, updateDocPackQuery, insertDocWfQuery = [];

    let aMappedPackagesId = PackagesId.map((PackageId) => "PackageId = '"+PackageId+"'");
    // Defining update dock_pack query
    updateDocPackQuery = UPDATE('DOC_PACK')
        .set(`AssignedTo = '${AssignedTo}', Status = 'ASSIGN', modifiedBy = '${updatedBy}', modifiedAt = '${updatedAt}'`)
        .where(`${aMappedPackagesId.join(' OR ')}`);
    // Execute the query and retrieve the data from the database.
    data = await tx.run(updateDocPackQuery);

    // Return the result with status code, number of affected rows as count, and message.
    if (data == null || data == undefined) {
        throw new Error({
            status: 500,
            message: 'Update failed'
        });
    }

    // Defining insert query for doc_wf table
    let aEntries = await Promise.all(PackagesId.map(async sPackageId => {
        // Get SeqNo from DOC_WF
        query = SELECT.one(['max(SEQNO) as SeqNo'])
            .from('DOC_WF')
            .where({ PACKAGEID: sPackageId });
        data = await tx.run(query);
        let seqNo = data?.SeqNo ? data.SeqNo + 1 : 1;
        let note = `${updatedBy} assigned to ${AssignedTo}`;
        return {
                PackageId: sPackageId,
                SeqNo: seqNo,
                Action: 'ASSIGN',
                ActionAt: updatedAt,
                ActionBy: updatedBy,
                Note: note
            }
        })
    ); 
    insertDocWfQuery = INSERT.into('DOC_WF').entries(aEntries);
    // Execute the query and retrieve the data from the database.
    data = await tx.run(insertDocWfQuery);

    // Return the result with status code, number of affected rows as count, and message.
    if (data == null || data == undefined) {
        throw new Error({
            status: 500,
            message: 'Insert failed'
        });
    }
    // Return the status code and message.
    return {
        status: 201,
        message: `Invoice successfully assigned to user: ${AssignedTo}`
    };
};
