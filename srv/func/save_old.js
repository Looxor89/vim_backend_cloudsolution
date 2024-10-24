const { checkSaveScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkSaveScope(request.req)) {
        // Validate incoming payload
        let { error } = schema.action_save.validate(request.data.payload, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            // Extract payload data from the incoming request.
            let {
                PackageId,
                invoice
            } = request.data.payload,
                credit = null,
                insertDocExtQuery,
                createdBy = request.req.user.id,
                createdAt = new Date(),
                modifiedBy = request.req.user.id,
                modifiedAt = new Date(),
                data, updateDocPackQuery, updateDockListQuery;
            let jsonInvoice = JSON.parse(invoice),
                companyCode = Mode === 'PO' ? jsonDox.header.dBukrs : jsonDox.header.Bukrs;

            if (Mode === 'PO') {
                if (jsonDox.header.InvInd === true) {
                    credit = 'POCREDM'
                } else {
                    credit = 'POINV'
                }
            } else if (Mode === 'NONPO') {
        
                if (jsonDox.header.InvInd === true) {
                    credit = 'NONPOCREDM'
        
                } else {
                    credit = 'NONPOINV'
                }
            }

            try {
                // Get SeqNo from DOC_EXTRACT
                let query = SELECT(`IFNULL(max(SeqNo), 0) +1 AS SeqNo`).from(`DOC_EXTRACT`).where(`JobId = '${JobId}'`).groupBy('JobId');
                data = await tx.run(query);
                let seqNo = 1;
                if (data.length > 0) {
                    seqNo = data[0].SeqNo;
                } 
                data = null;
                // Defining insert query for doc_extract table
                insertDocExtQuery = INSERT.into('DOC_EXTRACT', { 'JobId': JobId, 'SeqNo': seqNo, 'Metadata': dox, 'Flag': null, 'CreatedBy': createdBy, 'ModifiedBy': modifiedBy, 'CreatedAt': createdAt, 'ModifiedAt': modifiedAt});
                // Execute the query and retrieve the data from the database.
                data = await tx.run(insertDocExtQuery);

                // Defining update dock_list query
                updateDockListQuery = UPDATE('DOC_LIST')
                    .set(`DocCategory = '${credit}'`)
                    .where(`PackageId = '${PackageId}' and JobId = '${JobId}'`);
                // Execute the query and retrieve the data from the database.
                data = await tx.run(updateDockListQuery);

                // Return the result with status code, number of affected rows as count, and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Update failed'
                    };
                }

                data = null;

                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`CompanyCode = '${companyCode}', ModifiedBy = '${modifiedBy}', ModifiedAt = '${modifiedAt}'`)
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

                await tx.commit();

                // Return the status code and message.
                return {
                    status: 201,
                    message: `Data stored in database`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during save operation: ${err}`);
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
