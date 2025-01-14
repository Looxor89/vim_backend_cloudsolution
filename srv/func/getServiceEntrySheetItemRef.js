const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const serviceEntrySheetRef = request.req.query.ServiceEntrySheetRef;
    if (!serviceEntrySheetRef) {
        // Return error response if Supplier is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultServiceEntrySheetItemRefRequest = await serviceRequestS4_HANA.get(process.env['Path_API_serviceentrysheet']+"/"+serviceEntrySheetRef+"/"+process.env['Path_API_serviceentrysheet_2']);
    return { status: 200, result: oResultServiceEntrySheetItemRefRequest, message: 'Executed' };
};