const { buildPayloadForSubmitInvoice, buildPayloadForSubmitAttachment } = require('./utils/payloadBuilder');
const { checkSubmitScope } = require('./utils/scopes');
const cds = require('@sap/cds');
const schema = require('./utils/validator');
const mimeTypes = require('../resources/mimeTypes.json');

"use strict";

module.exports = async (request, tx) => {
    // Extract payload data from the incoming request.
    const { PackageId,
        Invoice
    } = request.data.payload,
        modifiedBy = request.req.authInfo.getLogonName(),
        modifiedAt = new Date();
    let data;

    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    let oPayload = buildPayloadForSubmitInvoice(Invoice);

    let oResult = await serviceRequestS4_HANA.post(process.env['Path_API_SUPPLIER_INVOICE'], oPayload),
        sReferenceDocument = oResult.SupplierInvoice,
        sFiscalYear = oResult.FiscalYear,
        sCompanyCode = oResult.CompanyCode;

    // Perform GET request in order to get AccountingDocument
    oResult = await serviceRequestS4_HANA.get(process.env['Path_API_GLACCOUNTLINEITEM'] + `?$select=AccountingDocument&$format=json&$filter=ReferenceDocument eq '${sReferenceDocument}'&$top=1`);
    let sAccountingDocument = oResult[0].AccountingDocument,
        LinkedSapObjectKey = sCompanyCode + sAccountingDocument.padStart(10, "0") + sFiscalYear,
        oInvoiceAttachments = Invoice.Allegati;

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
    let updateDocPackQuery = UPDATE('DOC_PACK')
        .set(`modifiedBy = '${modifiedBy}', modifiedAt = '${modifiedAt}', Status = 'POSTED', ReferenceDocument = '${sReferenceDocument}', FiscalYear = '${sFiscalYear}', CompanyCode = '${sCompanyCode}'`)
        .where(`PackageId = '${PackageId}'`);
    // Execute the query and retrieve the data from the database.
    data = await tx.run(updateDocPackQuery);

    // Return the result with status code, number of affected rows as count, and message.
    if (data == null || data == undefined) {
        throw new Error('Update failed');
    }

    let deleteQuery = DELETE.from('ERROR_LOG')
        .where(`PackageId = '${PackageId}'`);

    await executeQuery(tx, deleteQuery);

    // Return the status code and message.
    return {
        status: 201,
        message: `Data stored in database`
    };

};
