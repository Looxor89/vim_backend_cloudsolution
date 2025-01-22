
"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const companyCode = request.req.query.CompanyCode;
    if (!companyCode) {
        // Return error response if CompanyCode is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultGlAccountRequest = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_GLACCOUNTS_CDS']+"&$filter=CompanyCode eq '"+companyCode+"'");
    return { status: 200, result: oResultGlAccountRequest, message: 'Executed' };
};