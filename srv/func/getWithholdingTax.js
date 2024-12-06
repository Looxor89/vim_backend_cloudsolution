const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const supplier = request.req.query.Supplier;
    if (!supplier) {
        // Return error response if BusinessPartner is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultWithholdingTaxRequest = await serviceRequestS4_HANA.get(process.env['Path_API_WITHHOLDINGTAX']+"&$filter=Supplier eq '"+supplier+"'&$select=WithholdingTaxType,WithholdingTaxCode");
    return { status: 200, result: oResultWithholdingTaxRequest, message: 'Executed' };
};