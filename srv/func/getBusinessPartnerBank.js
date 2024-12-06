const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const businessPartner = request.req.query.BusinessPartner;
    if (!businessPartner) {
        // Return error response if BusinessPartner is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultBusinessPartnerBankRequest = await serviceRequestS4_HANA.get(process.env['Path_API_BUSINESS_PARTNER_BANK']+"&$filter=BusinessPartner eq '"+businessPartner+"'&$select=BankIdentification,BankName,BankNumber,IBAN");
    return { status: 200, result: oResultBusinessPartnerBankRequest, message: 'Executed' };
};