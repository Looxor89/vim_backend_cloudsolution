
"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const purchaseOrderRef = request.req.query.PurchaseOrderRef;
    const purchaseOrderItemRef = request.req.query.PurchaseOrderItemRef;
    if (!purchaseOrderRef || !purchaseOrderItemRef) {
        // Return error response if CompanyCode is not provided
        return { status: 400, message: 'Bad Request' };
    }
    let oReferenceDocumentObject = {
        "ReferenceDocument" : null,
        "ReferenceDocumentFiscalYear" : null,
        "ReferenceDocumentItem" : null,
    }
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    
    const oResultPurchaseOrderItemRefRequest = await serviceRequestS4_HANA.get(process.env['Path_API_purchaseorder'] + "/" + purchaseOrderRef + "/" + process.env['Path_API_purchaseorder_2'] + "&$filter=PurchaseOrderItem eq '" + purchaseOrderItemRef + "'");
    const bInvoiceIsGoodsReceiptBased = oResultPurchaseOrderItemRefRequest.value[0]?.InvoiceIsGoodsReceiptBased;
    if (bInvoiceIsGoodsReceiptBased !== null && bInvoiceIsGoodsReceiptBased !== undefined) {
        const oResultGoodsMovements = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_GOODSMOVEMENTS_CDS'] + "&$filter=PurchaseOrder eq '" + purchaseOrderRef + "' and PurchaseOrderItem eq '" + purchaseOrderItemRef + "'");
        oReferenceDocumentObject.ReferenceDocument = oResultGoodsMovements[0]?.MaterialDocument;
        oReferenceDocumentObject.ReferenceDocumentFiscalYear = oResultGoodsMovements[0]?.MaterialDocumentYear;
        oReferenceDocumentObject.ReferenceDocumentItem = oResultGoodsMovements[0]?.MaterialDocumentItem;
    }

    let aResultAccountAssignmentRequest = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_POACCOUNTASSIGNMENT_CDS']+"&$filter=PurchaseOrder eq '"+purchaseOrderRef+"' and PurchaseOrderItem eq '"+purchaseOrderItemRef+"'");
    aResultAccountAssignmentRequest = aResultAccountAssignmentRequest.map(oItem => {
        return {...oItem, ...oReferenceDocumentObject}
    })
    return { status: 200, result: aResultAccountAssignmentRequest, message: 'Executed' };
};