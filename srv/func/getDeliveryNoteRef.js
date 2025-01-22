const { formatDateFromFunctionToString, formatTimeToString } = require('./utils/utilities');

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
    var oResultDeliveryNoteRefRequest = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_INBOUNDDELIVERIES_CDS']+"&$filter=Supplier eq '"+supplier+"' and DeliveryDocumentBySupplier ne ''");
    
    oResultDeliveryNoteRefRequest.forEach((result) => {
        if (result.CreationDate) {
            result.CreationDate = formatDateFromFunctionToString(result.CreationDate); 
        }

        if (result.CreationTime) {
            result.CreationTime = formatTimeToString(result.CreationTime);
        }
    });
    
    return { status: 200, result: oResultDeliveryNoteRefRequest, message: 'Executed' };
};