const { getDateWithMilliseconds, getDateWithMillisecondsWithoutParam } = require('./utils/utilities');
const { checkSubmitScope } = require('./utils/scopes');
const cds = require('@sap/cds');
const schema = require('./utils/validator');
const moment = require('moment');

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
            let oPayload = {
                CompanyCode: null,
                DocumentDate: null,
                PostingDate: null,
                InvoicingParty: null,
                DocumentCurrency: null,
                InvoiceGrossAmount: null,
                DocumentHeaderText: null,
                PaymentTerms: null,
                AccountingDocumentType: null,
                SupplyingCountry: null,
                PaymentMethod: null,
                AssignmentReference: null,
                SupplierPostingLineItemText: null,
                TaxIsCalculatedAutomatically: null,
                SuplrInvcIsCapitalGoodsRelated: null,
                TaxDeterminationDate: null,
                InvoiceReceiptDate: null,
                IsEUTriangularDeal: null,
                to_SupplierInvoiceItemGLAcct: {
                    results: []
                }
            },
            oBody = jsonInvoice.body[0];
            
            try {
                const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
                const serviceRequestS4_HANA = serviceS4_HANA.tx(request);

                handleError(null, 'Mapping still not ready for this invoice document mode');

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
                
                await serviceRequestS4_HANA.post('/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice', oPayload);

                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`ModifiedBy = '${modifiedBy}', ModifiedAt = '${modifiedAt}', Status = 'POSTED'`)
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
