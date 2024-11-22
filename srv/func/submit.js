const { buildPayloadForSubmitInvoice, buildPayloadForSubmitAttachment } = require('./utils/payloadBuilder');
const { checkSubmitScope } = require('./utils/scopes');
const cds = require('@sap/cds');
const schema = require('./utils/validator');
const mimeTypes = require('../resources/mimeTypes.json');

"use strict";

module.exports = async (request, tx) => {
    // Extract payload data from the incoming request.
    const { PackageId,
        Invoice,
        RemovedPoLineDetails,
        RemovedGlAccountLineDetails } = request.data.payload,
        modifiedBy = request.req.authInfo.getLogonName(),
        modifiedAt = new Date();
    let data,
    jsonInvoice = JSON.parse(Invoice);

    try {
        jsonInvoice = JSON.parse(Invoice);
    } catch (err) {
        console.error('Failed to parse invoice JSON:', err);
        // return { status: 422, message: 'Invalid Invoice JSON' }
        throw new Error('Invalid Invoice JSON');
    }
    // Validate incoming payload
    const valid = validateInvoice(jsonInvoice);
    if (!valid.status) {
        // return { status: 422, message: valid.message }
        throw new Error(`Validation failed: ${valid.message}`);
    }

    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    let oPayload = buildPayloadForSubmitInvoice(jsonInvoice);

    let oResult = await serviceRequestS4_HANA.post(process.env['Path_API_SUPPLIER_INVOICE'], oPayload),
        sReferenceDocument = oResult.SupplierInvoice,
        sFiscalYear = oResult.FiscalYear,
        sCompanyCode = oResult.CompanyCode;

    // Perform GET request in order to get AccountingDocument
    oResult = await serviceRequestS4_HANA.get(process.env['Path_API_GLACCOUNTLINEITEM'] + `?$select=AccountingDocument&$format=json&$filter=ReferenceDocument eq '${sReferenceDocument}'&$top=1`);
    let sAccountingDocument = oResult[0].AccountingDocument,
        LinkedSapObjectKey = sCompanyCode + sAccountingDocument.padStart(10, "0") + sFiscalYear,
        oInvoiceAttachments = jsonInvoice.body[0].Allegati;

    oInvoiceAttachments.forEach(async (oAttachment) => {
        let AttachmentExtension = oAttachment.formatoAttachment,
        Attachment = oAttachment.attachment,
        AttachmentName = oAttachment.nomeAttachment,
        AttachmentType = mimeTypes(oAttachment.formatoAttachment.toLowerCase()),
        oPayload = buildPayloadForSubmitAttachment(AttachmentExtension, Attachment, AttachmentName, AttachmentType, LinkedSapObjectKey);

        // Perform POST request
        await serviceRequestS4_HANA.post(
            process.env['Path_API_CV_ATTACHMENT_SRV'],
            oPayload.Body,
            oPayload.Headers
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
        throw new Error('Update failed');
    }

    // Return the status code and message.
    return {
        status: 201,
        message: `Data stored in database`
    };

};

// Helper function to validate the invoice
function validateInvoice(invoice) {
    const { error } = schema.action_save_submit.validate(invoice, { abortEarly: false });
    let valid = error == null;
    let details = error ? error.message : null;
    return { status: valid, message: details };
}
