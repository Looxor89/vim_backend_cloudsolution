const { buildPayloadForSubmitAttachment } = require('./utils/payloadBuilder');
const { checkReadScope } = require('./utils/scopes');
const { v4: uuidv4 } = require('uuid');
const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Validate incoming payload
    let { error } = schema.action_addAttachment.validate(request.data.payload, { abortEarly: false });
    let valid = error == null;
    //If payload is valid then do assign
    if (valid) {
        // Extract payload data from the incoming request.
        let {
            PackageId,
            CompanyCode,
            ReferenceDocument,
            FiscalYear,
            BodyId,
            AttachmentName,
            AttachmentType,
            AttachmentExtension,
            Attachment
        } = request.data.payload,
            updatedBy = request.req.authInfo.getLogonName(),
            updatedAt = new Date(),
            data, updateDocPackQuery, insertAllegatiQuery;

        try {
            const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
            const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
            // Defining insert query for doc_list table
            insertAllegatiQuery = INSERT.into('Allegati', { 'ID': uuidv4(), 'body_Id': BodyId, 'nomeAttachment': AttachmentName, 'algoritmoCompressione': null, 'formatoAttachment': AttachmentExtension, 'descrizioneAttachment': null, 'attachment': Attachment });
            // Execute the query and retrieve the data from the database.
            data = await tx.run(insertAllegatiQuery);

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


            // Perform GET request in order to get AccountingDocument
            let oResult = await serviceRequestS4_HANA.get(process.env['Path_API_GLACCOUNTLINEITEM'] + `?$select=AccountingDocument&$format=json&$filter=ReferenceDocument eq '${ReferenceDocument}'&$top=1`),
                sAccountingDocument = oResult[0].AccountingDocument,
                LinkedSapObjectKey = CompanyCode + sAccountingDocument.padStart(10, "0") + FiscalYear;
            let oPayload = buildPayloadForSubmitAttachment(AttachmentExtension, Attachment, AttachmentName, AttachmentType, LinkedSapObjectKey);

            // Perform POST request
            await serviceRequestS4_HANA.post(
                process.env['Path_API_CV_ATTACHMENT_SRV'],
                oPayload.Body,
                oPayload.Headers
            );


            // Return the status code and message.
            return {
                status: 201,
                message: `Document successfully attached for package: ${PackageId}`
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
};
