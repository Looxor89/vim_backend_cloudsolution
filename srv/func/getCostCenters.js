const { formatDateFromFunctionToString } = require('./utils/utilities');

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
    var oResultCostCentersRequest = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_COSTCENTERS_CDS']+"&$filter=CompanyCode eq '"+companyCode+"'");
    
    // Process the results to extract and update ValidityEndDate
    oResultCostCentersRequest.forEach((result) => {
        if (result.ValidityEndDate) {
            result.ValidityEndDate = formatDateFromFunctionToString(result.ValidityEndDate); // Update with milliseconds as a number
        }
    });
    
    return { status: 200, result: oResultCostCentersRequest, message: 'Executed' };
};