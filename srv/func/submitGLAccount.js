const { glAccountBuildPayload } = require('./utils/payloadBuilder');
const { checkSubmitScope } = require('./utils/scopes');
const cds = require('@sap/cds');
const schema = require('./utils/validator');
const mimeTypes = require('../resources/mimeTypes.json');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkSubmitScope(request.req)) {
        // Extract payload data from the incoming request.
        let {
            PackageId,
            Invoice
        } = request.data.payload,
            modifiedBy = request.req.user.id,
            modifiedAt = new Date(),
            data;
        let jsonInvoice = JSON.parse(Invoice)
        // Validate incoming payload
        let { error } = schema.action_save_submit.validate(jsonInvoice, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            try {
                const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
                const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
                let oPayload = glAccountBuildPayload(jsonInvoice);

                async function handleError(data, msg) {
                    // Return the result with status code, number of affected rows as count, and message.
                    if (data == null || data == undefined) {
                        await tx.rollback();
                        return {
                            status: 500,
                            message: msg
                        };
                    }
                }
                
                let oResult = await serviceRequestS4_HANA.post(process.env['Path_API_SUPPLIER_INVOICE'], oPayload),
                sReferenceDocument = oResult.SupplierInvoice,
                sFiscalYear = oResult.FiscalYear,
                sCompanyCode = oResult.CompanyCode;

                // Perform GET request in order to get AccountingDocument
                oResult = await serviceRequestS4_HANA.get(process.env['Path_API_GLACCOUNTLINEITEM'] + `?$select=AccountingDocument&$format=json&$filter=ReferenceDocument eq '${sReferenceDocument}'&$top=1`);
                let sAccountingDocument = oResult[0].AccountingDocument,
                    LinkedSapObjectKey = sCompanyCode + sAccountingDocument.padStart(10, "0") + sFiscalYear,
                    oInvoiceAttachments = jsonInvoice.body[0].allegati;

                oInvoiceAttachments.forEach(async (oAttachment) => {
                    let oBody = {
                        "DocumentInfoRecordDocType": oAttachment.formatoAttachment,
                        "Content": oAttachment.attachment,
                        "Content-Disposition": "form-data",
                        "name": "myFileUpload[]",
                        "filename": oAttachment.nomeAttachment,
                        "Content-Type": mimeTypes(oAttachment.formatoAttachment.toLowerCase())
                    },
                    oHeaders = {
                        'slug': oAttachment.nomeAttachment,
                        'BusinessObjectTypeName': 'BKPF',
                        'LinkedSAPObjectKey': LinkedSapObjectKey
                    };

                    // Perform POST request
                    await serviceRequestS4_HANA.post(
                        process.env['Path_API_CV_ATTACHMENT_SRV'],
                        oBody,
                        oHeaders
                    );
                });
                
                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`ModifiedBy = '${modifiedBy}', ModifiedAt = '${modifiedAt}', Status = 'POSTED', ReferenceDocument = '${sReferenceDocument}', FiscalYear = '${sFiscalYear}', CompanyCode = '${sCompanyCode}'`)
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
                    message: `Data stored in database`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during submit operation: ${err}`);
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
