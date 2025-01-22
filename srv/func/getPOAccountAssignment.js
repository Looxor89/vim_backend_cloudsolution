
"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const purchaseOrderRef = request.req.query.PurchaseOrderRef;
    const purchaseOrderItemRef = request.req.query.PurchaseOrderItemRef;
    if (!purchaseOrderRef || !purchaseOrderItemRef) {
        // Return error response if CompanyCode is not provided
        return { status: 400, message: 'Bad Request' };
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultAccountAssignmentRequest = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_POACCOUNTASSIGNMENT_CDS']+"&$filter=PurchaseOrder eq '"+purchaseOrderRef+"' and PurchaseOrderItem eq '"+purchaseOrderItemRef+"'");
    return { status: 200, result: oResultAccountAssignmentRequest, message: 'Executed' };
};