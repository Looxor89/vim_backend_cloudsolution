const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const companyCode = request.req.query.CompanyCode, 
    houseBank = request.req.query.HouseBank;
    if (!companyCode || !houseBank) {
        // Return error response if CompanyCode is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultHouseBanksAccountsRequest = await serviceRequestS4_HANA.get(process.env['Path_API_HOUSEBANKSACCOUNTS']+"&$filter=CompanyCode eq '"+companyCode+"' and HouseBank eq '"+houseBank+"'&$select=HouseBankAccount, IBAN, BankAccountDescription");
    return { status: 200, result: oResultHouseBanksAccountsRequest, message: 'Executed' };
};