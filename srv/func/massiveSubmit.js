const { buildPayloadForSubmitInvoice, buildPayloadForSubmitAttachment } = require('./utils/payloadBuilder');
const { checkSubmitScope } = require('./utils/scopes');
const cds = require('@sap/cds');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {

    const aInvoices = request.data.payload;
    const modifiedBy = request.req.authInfo.getLogonName();
    const modifiedAt = new Date();
    let aGLAccountInvoices = [], aPOInvoices = [], aErrorInvoicesPackageId = [];

    // Validate the payload against schema
    const { error } = schema.action_massiveSubmit.validate(aInvoices, { abortEarly: false });
    if (error) {
        console.error(error);
        return {
            code: '422',
            message: 'Error',
            target: 'Invalid POST Payload',
            status: 422
        };
    }

    // Separate invoices based on their category
    aInvoices.forEach(oInvoice => {
        if (oInvoice.DocCategory === 'Non-PO Invoice') {
            aGLAccountInvoices.push(oInvoice.PackageId);
        } else {
            aPOInvoices.push(oInvoice.PackageId);
        }
    });

    try {
        const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
        const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
        const serviceBackEnd = await cds.connect.to('odataBackEnd');
        const serviceRequestBackEnd = serviceBackEnd.tx(request);

        // Helper to handle errors and rollback
        function handleError(jsonInvoice, msg, err) {
            // await tx.rollback(err);
            return {
                status: 500,
                message: msg,
                PackageId: jsonInvoice.navigation_to_PackageId
            };
        }

        // Function to handle GL Account invoice submissions
        async function performSubmitRequestForGLAccount(jsonInvoice) {
            try {
                let oPayload = glAccountbuildPayloadForSubmitInvoice(jsonInvoice);

                const oResult = await serviceRequestS4_HANA.post(process.env['Path_API_SUPPLIER_INVOICE'], oPayload);

                const updateDocPackQuery = UPDATE('DOC_PACK')
                    .set({
                        ModifiedBy: modifiedBy,
                        ModifiedAt: modifiedAt,
                        Status: 'POSTED',
                        ReferenceDocument: oResult.SupplierInvoice,
                        FiscalYear: oResult.FiscalYear,
                        CompanyCode: oResult.CompanyCode
                    })
                    .where({ PackageId: jsonInvoice.navigation_to_PackageId });

                const data = await tx.run(updateDocPackQuery);
                if (!data) {
                    tx.rollback('Update failed')
                    // return await handleError(jsonInvoice, 'Update failed', null);
                }

                return { status: 200, message: 'ok', PackageId: jsonInvoice.navigation_to_PackageId };
            } catch (err) {
                console.error(`Error during GL Account submission: ${err}`);
                return handleError(jsonInvoice, 'Internal server error', err);
            }
        }

        // Function to handle PO invoice submissions
        async function performSubmitRequestForPO(jsonInvoice) {
            try {

                let oPayload = poAccountbuildPayloadForSubmitInvoice(jsonInvoice);

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

                const updateDocPackQuery = UPDATE('DOC_PACK')
                    .set({
                        ModifiedBy: modifiedBy,
                        ModifiedAt: modifiedAt,
                        Status: 'POSTED',
                        ReferenceDocument: sReferenceDocument,
                        FiscalYear: sFiscalYear,
                        CompanyCode: sCompanyCode
                    })
                    .where({ PackageId: jsonInvoice.navigation_to_PackageId });

                const data = await tx.run(updateDocPackQuery);
                if (!data) {
                    tx.rollback('Update failed')
                    // return await handleError(jsonInvoice, 'Update failed', null);
                }

                return { status: 200, message: 'ok', PackageId: jsonInvoice.navigation_to_PackageId };
            } catch (err) {
                console.error(`Error during PO submission: ${err}`);
                return handleError(jsonInvoice, 'Internal server error', err);
            }
        }

        // Query backend for GL Account invoices
        const queryGLAccountInvoices = process.env['Path_API_GLAccount_Invoices'] + `&$filter=navigation_to_PackageId eq ${aGLAccountInvoices.join(' or navigation_to_PackageId eq ')}`;
        const oResultQueryGLAccountInvoices = await serviceRequestBackEnd.get(queryGLAccountInvoices);

        // Process GL Account invoices
        for (const oInvoice of oResultQueryGLAccountInvoices.value) {
            const oRequestResult = await performSubmitRequestForGLAccount(oInvoice);
            if (oRequestResult.status === 500) {
                aErrorInvoicesPackageId.push(oRequestResult.PackageId);
            }
        }

        // Query backend for PO invoices
        const queryPOInvoices = process.env['Path_API_PO_Invoices'] + `&$filter=navigation_to_PackageId eq ${aPOInvoices.join(' or navigation_to_PackageId eq ')}`;
        const oResultQueryPOInvoices = await serviceRequestBackEnd.get(queryPOInvoices);

        // Process PO invoices
        for (const oInvoice of oResultQueryPOInvoices.value) {
            const oRequestResult = await performSubmitRequestForPO(oInvoice);
            if (oRequestResult.status === 500) {
                aErrorInvoicesPackageId.push(oRequestResult.PackageId);
            }
        }

        // Final success response
        return {
            status: 201,
            message: 'Submit action completed',
            ErrorInvoicesPackageIds: aErrorInvoicesPackageId
        };

    } catch (err) {
        console.error(`Connectivity error: ${err}`);
        await tx.rollback(err);
        return {
            status: 500,
            message: 'Internal server error',
            ErrorInvoicesPackageIds: aGLAccountInvoices.concat(aPOInvoices)
        };
    }
};
