const { formatDateTimeToString } = require('./utils/utilities');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const supplier = request.req.query.Supplier;
    if (!supplier) {
        // Return error response if Supplier is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    var oResultServiceEntrySheetRefRequest = await serviceRequestS4_HANA.get(process.env['Path_API_serviceentrysheet']+"?$format=json&$filter=Supplier eq '"+supplier+"'&$select=ServiceEntrySheet,CreatedByUser,CreationDateTime,PurchasingOrganization,PurchasingGroup,MaterialDocument,MaterialDocumentYear,Supplier,PurchaseOrder");
    
    oResultServiceEntrySheetRefRequest.value.forEach((result) => {
        if (result.CreationDateTime) {
            result.CreationDateTime = formatDateTimeToString(result.CreationDateTime);
        }
    });
    return { status: 200, result: oResultServiceEntrySheetRefRequest, message: 'Executed' };
};