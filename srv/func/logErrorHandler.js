
const { json } = require('express');
const { v4: uuidv4 } = require('uuid');

"use strict";

module.exports = async (request, tx, errorMessage) => {
    // Extract payload data from the incoming request.
    const { PackageId,
        Invoice } = request.data.payload,
        createdBy = request.req.authInfo.getLogonName(),
        modifiedBy = request.req.authInfo.getLogonName(),
        createdAt = new Date(),
        modifiedAt = new Date();
    let data, 
        jsonInvoice = JSON.parse(Invoice), 
        submittedInvoice = buildPayloadForSubmitInvoice(jsonInvoice);
    
    let errorLogQuery = INSERT.into('ERROR_LOG')
        .entries({
            ID: uuidv4(),
            createdAt: createdAt,
            createdBy: createdBy,
            PackageId: PackageId,
            ErrorMessage: errorMessage,
            SubmittedInvoice: JSON.stringify(submittedInvoice)
        });
    data = await tx.run(errorLogQuery);

    // Return the result with status code, number of affected rows as count, and message.
    if (data == null || data == undefined) {
        throw new Error('Inserting into ERROR_LOG table failed');
    }

    // Defining update dock_pack query
    let updateDocPackQuery = UPDATE('DOC_PACK')
        .set(`modifiedBy = '${modifiedBy}', modifiedAt = '${modifiedAt}', Status = 'ERROR'`)
        .where(`PackageId = '${PackageId}'`);
    // Execute the query and retrieve the data from the database.
    data = await tx.run(updateDocPackQuery);

    // Return the result with status code, number of affected rows as count, and message.
    if (data == null || data == undefined) {
        throw new Error('DOC_PACK updating failed');
    }

    // Return the status code and message.
    return {
        status: 201,
        message: `Data stored in database`
    };

};