const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const header_Id_ItalianInvoiceTrace = request.req.query.header_Id_ItalianInvoiceTrace;
    if (!header_Id_ItalianInvoiceTrace) {
        // Return error response if BusinessPartner is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const oRecord = await tx.run(
        SELECT('*').from('FatturaElettronica')
        .where({ ID: header_Id_ItalianInvoiceTrace }));
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultPaymentMethodsRequest = await serviceRequestS4_HANA.get(process.env['Path_API_PAYMENTMETHODS']+"&$filter=Country eq '"+oRecord[0].cedentePrestatore_DatiAnagrafici_IdFiscaleIVA_IdPaese+"'&$select=PaymentMethod,PaymentMethodName");
    return { status: 200, result: oResultPaymentMethodsRequest, message: 'Executed' };
};