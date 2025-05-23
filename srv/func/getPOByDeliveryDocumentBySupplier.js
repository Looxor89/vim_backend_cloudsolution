"use strict";

module.exports = async (request, tx) => {
    const { InboundDeliveries } = request.data.payload;

    if (!Array.isArray(InboundDeliveries) || InboundDeliveries.length === 0) {
        return { status: 400, message: 'No Inbound Deliveries provided' };
    }

    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);

    const deliveriesGroupedByPO = new Map();

    // Group PurchaseOrderItems by PurchaseOrder
    for (const delivery of InboundDeliveries) {
        const { PurchaseOrder, PurchaseOrderItem } = delivery;

        if (!PurchaseOrder || !PurchaseOrderItem) {
            continue; // Skip invalid entries
        }

        if (!deliveriesGroupedByPO.has(PurchaseOrder)) {
            deliveriesGroupedByPO.set(PurchaseOrder, new Set());
        }

        deliveriesGroupedByPO.get(PurchaseOrder).add(PurchaseOrderItem);
    }

    const allResults = [];

    // Process each PurchaseOrder
    for (const [purchaseOrder, itemSet] of deliveriesGroupedByPO.entries()) {
        const filterString = Array.from(itemSet)
            .map(item => `PurchaseOrderItem eq '${parseInt(item).toString()}'`)
            .join(' or ');

        const url = `${process.env['Path_API_purchaseorder']}/${purchaseOrder}/${process.env['Path_API_purchaseorder_2']}&$filter=${filterString}`;
        var result = [];
        try {
            result = await serviceRequestS4_HANA.get(url);
            
        } catch (error) {
            return { status: 500, message: `Error fetching data for PO ${purchaseOrder}: ${error.message}` };
        }

        var filterStringPoHistory = `PurchasingHistoryCategory eq 'E' and DocumentReferenceID eq '${InboundDeliveries[0].DeliveryDocumentBySupplier}' and PurchaseOrder eq '${purchaseOrder}'`;
        filterStringPoHistory = filterStringPoHistory + " and (" + Array.from(itemSet).map(item => `PurchaseOrderItem eq '${item.padStart(5, "0")}'`).join(' or ') + ")";
        var urlPoHistory = `${process.env['Path_API_pohistory']}&$filter=${filterStringPoHistory}`;

        try {
            var resultPoHistory = await serviceRequestS4_HANA.get(urlPoHistory);
            result.value.forEach(deliveryItem => {
                resultPoHistory.forEach(poHistoryItem => {
                    if (deliveryItem.PurchaseOrderItem.padStart(5, "0") === poHistoryItem.PurchaseOrderItem) {
                        deliveryItem.ActualDeliveryQuantity = poHistoryItem.PurchaseOrderAmount;
                        deliveryItem.PurchaseOrderAmount = poHistoryItem.PurchaseOrderAmount;
                    }
                })
            });

            allResults.push(...result.value);
            
        } catch (error) {
            return { status: 500, message: `Error fetching data for PO ${purchaseOrder}: ${error.message}` };
        }
    }

    return {
        status: 200,
        result: allResults,
        message: 'Executed'
    };
};