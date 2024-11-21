const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const packageId = request.req.query.PackageId;
    if (!packageId) {
        // Return error response if PackageId is not provided
        return { status: 400, message: 'Bad Request' };
    }

    try {
        // Fetch header data based on PackageId
        const headerData = await fetchHeaderData(tx, packageId);
        if (!headerData) {
            // Return error if header data not found
            return { status: 404, message: 'Data not found' };
        }

        // Fetch body and payment data based on header information
        const bodyData = await fetchBodyData(tx, headerData.headerFatturaElettronica.ID);
        const paymentData = await fetchPaymentData(tx, bodyData.bodyFatturaElettronica.ID);

        // Construct and return the final result object with all retrieved data
        const result = createResultObject(headerData, bodyData, paymentData);
        return { status: 200, result: result, message: 'Executed' };
    } catch (err) {
        console.error(`Error during queries executions: ${err}`);
        return { status: 500, message: 'Internal server error' };
    }
};

// Fetch header data for a specific package
async function fetchHeaderData(tx, packageId) {
    // Query header invoice data by PackageId
    const headerFatturaElettronica = (await tx.run(
        SELECT('*').from('FatturaElettronica').where({ navigation_to_PackageId: packageId })
    ))[0];

    // Return null if no header data found
    if (!headerFatturaElettronica) return null;

    // Query additional invoice integration information by PackageId
    const headerInvoiceIntegrationInfo = (await tx.run(
        SELECT('*').from('InvoiceIntegrationInfo').where({ navigation_to_PackageId: packageId })
    ))[0];

    
    const dataSupplierInvoiceWhldgTax= (await tx.run(
        SELECT('*').from('SupplierInvoiceWhldgTax').where({ header_Id: headerInvoiceIntegrationInfo.ID })
    ));

    return { headerFatturaElettronica, headerInvoiceIntegrationInfo, dataSupplierInvoiceWhldgTax };
}

// Fetch body data and related records based on header ID
async function fetchBodyData(tx, headerId) {
    // Query main body data by header ID
    const bodyFatturaElettronica = (await tx.run(
        SELECT('*').from('FatturaElettronicaBody').where({ header_Id: headerId })
    ))[0];

    // Return null if no header data found
    if (!bodyFatturaElettronica) return null;

    // Run multiple queries concurrently to fetch associated details
    const [
        dataDatiRitenuta,
        dataDatiOrdineAcquisto,
        dataDettaglioLinee,
        dataDatiRiepilogo,
        dataDatiPagamento,
        dataAllegati,
        dataPOIntegrationInfoBody,
        dataGLAccountIntegrationInfoBody
    ] = await Promise.all([
        tx.run(SELECT('*').from('DatiRitenuta').where({ body_Id: bodyFatturaElettronica.ID })),
        tx.run(SELECT('*').from('DatiOrdineAcquisto').where({ body_Id: bodyFatturaElettronica.ID })),
        tx.run(SELECT('*').from('DettaglioLinee').where({ body_Id: bodyFatturaElettronica.ID })),
        tx.run(SELECT('*').from('DatiRiepilogo').where({ body_Id: bodyFatturaElettronica.ID })),
        tx.run(SELECT('*').from('DatiPagamento').where({ body_Id: bodyFatturaElettronica.ID })),
        tx.run(SELECT('*').from('Allegati').where({ body_Id: bodyFatturaElettronica.ID })),
        tx.run(SELECT('*').from('POIntegrationInfoBody').where({ header_Id: headerId })),
        tx.run(SELECT('*').from('GLAccountIntegrationInfoBody').where({ header_Id: headerId })),
    ]);

    // Return all retrieved data in an organized structure
    return { bodyFatturaElettronica, dataDatiRitenuta, dataDatiOrdineAcquisto, dataDettaglioLinee, dataDatiRiepilogo, dataDatiPagamento, dataAllegati, dataPOIntegrationInfoBody, dataGLAccountIntegrationInfoBody };
}

// Fetch payment details associated with a specific body ID
async function fetchPaymentData(tx, bodyId) {
    // Query payment data based on body ID
    const dataDatiPagamento = await tx.run(SELECT('*').from('DatiPagamento').where({ body_Id: bodyId }));
    // Query payment details for each payment entry and flatten the results
    const dataDettaglioPagamento = await Promise.all(
        dataDatiPagamento.map(oItem =>
            tx.run(SELECT('*').from('DettaglioPagamento').where({ datiPagamento_Id: oItem.ID }))
        )
    );

    return { dataDatiPagamento, dataDettaglioPagamento: dataDettaglioPagamento.flat() };
}

// Create the result object containing all invoice details
function createResultObject(headerData, bodyData, paymentData) {
    const { headerFatturaElettronica, headerInvoiceIntegrationInfo, dataSupplierInvoiceWhldgTax } = headerData;
    const { bodyFatturaElettronica, dataDatiRitenuta, dataDatiOrdineAcquisto, dataDettaglioLinee, dataDatiRiepilogo, dataDatiPagamento, dataAllegati, dataPOIntegrationInfoBody, dataGLAccountIntegrationInfoBody } = bodyData;
    const { dataDettaglioPagamento } = paymentData;

    // Generate arrays for GL Account and Purchase Order records
    const aGLAccountRecords = dataDettaglioLinee
        .filter(line => line.bodyGLAccountIntegrationInfo_ID)
        .map((line, index) => createLineItemForGLAccount(index + 1, line, bodyFatturaElettronica));

    const aPORecords = dataDettaglioLinee
        .filter(line => line.bodyPOIntegrationInfo_ID)
        .map((line, index) => createLineItemForPO(index + 1, line, bodyFatturaElettronica));

    const aDataSupplierInvoiceWhldgTax = dataSupplierInvoiceWhldgTax.map((oItem, index) => {
        return {
            "supplierInvoiceWhldgTax_Id": oItem.ID,
            "header_Id_InvoiceIntegrationInfo": oItem.header_Id,
            "WithholdingTaxType": oItem.withholdingTaxType ? oItem.withholdingTaxType : null,
            "DocumentCurrency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
            "WithholdingTaxCode": oItem.withholdingTaxCode ? oItem.withholdingTaxCode : null,
            "WithholdingTaxBaseAmount": oItem.withholdingTaxBaseAmount ? oItem.withholdingTaxBaseAmount : null,
            "WhldgTaxBaseIsEnteredManually": oItem.whldgTaxBaseIsEnteredManually ? oItem.whldgTaxBaseIsEnteredManually : null
        }
    });

    // Assemble final result object with all relevant data fields
    return {
        "header_Id_ItalianInvoiceTrace": headerFatturaElettronica.ID,
        "header_Id_InvoiceIntegrationInfo": headerInvoiceIntegrationInfo.ID,
        "Transaction": headerInvoiceIntegrationInfo.transaction ? headerInvoiceIntegrationInfo.transaction : null,
        "CompanyCode": headerInvoiceIntegrationInfo.companyCode ? headerInvoiceIntegrationInfo.companyCode : null,
        "DocumentDate": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data : null,
        "InvoiceReceiptDate": headerInvoiceIntegrationInfo.invoiceReceiptDate ? headerInvoiceIntegrationInfo.invoiceReceiptDate : null,
        "PostingDate": headerInvoiceIntegrationInfo.postingDate ? headerInvoiceIntegrationInfo.postingDate : null,
        "InvoicingParty": headerInvoiceIntegrationInfo.invoicingParty ? headerInvoiceIntegrationInfo.invoicingParty : null,
        "Currency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
        // "SupplierInvoiceIDByInvcgParty": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Numero ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Numero : null,
        "SupplierInvoiceIDByInvcgParty": null,
        "InvoiceGrossAmount": parseFloat(bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento),
        "SupplierPostingLineItemText": headerInvoiceIntegrationInfo.supplierPostingLineItemText ? headerInvoiceIntegrationInfo.supplierPostingLineItemText : null,
        "TaxIsCalculatedAutomatically": headerInvoiceIntegrationInfo.taxIsCalculatedAutomatically ? headerInvoiceIntegrationInfo.taxIsCalculatedAutomatically : null,
        "DueCalculationBaseDate": headerInvoiceIntegrationInfo.dueCalculationBaseDate ? headerInvoiceIntegrationInfo.dueCalculationBaseDate : null,
        "ManualCashDiscount": headerInvoiceIntegrationInfo.manualCashDiscount ? headerInvoiceIntegrationInfo.manualCashDiscount : null,
        "PaymentTerms": headerInvoiceIntegrationInfo.paymentTerms ? headerInvoiceIntegrationInfo.paymentTerms : null,
        "CashDiscount1Days": headerInvoiceIntegrationInfo.cashDiscount1Days ? headerInvoiceIntegrationInfo.cashDiscount1Days : null,
        "CashDiscount1Percent": headerInvoiceIntegrationInfo.cashDiscount1Percent ? headerInvoiceIntegrationInfo.cashDiscount1Percent : null,
        "CashDiscount2Days": headerInvoiceIntegrationInfo.cashDiscount2Days ? headerInvoiceIntegrationInfo.cashDiscount2Days : null,
        "CashDiscount2Percent": headerInvoiceIntegrationInfo.cashDiscount2Percent ? headerInvoiceIntegrationInfo.cashDiscount2Percent : null,
        "FixedCashDiscount": headerInvoiceIntegrationInfo.fixedCashDiscount ? headerInvoiceIntegrationInfo.fixedCashDiscount : null,
        "NetPaymentDays": headerInvoiceIntegrationInfo.netPaymentDays ? headerInvoiceIntegrationInfo.netPaymentDays : null,
        "BPBankAccountInternalID": headerInvoiceIntegrationInfo.bPBankAccountInternalID ? headerInvoiceIntegrationInfo.bPBankAccountInternalID : null,
        // "PaymentMethod": dataDettaglioPagamento.length > 0 ? dataDettaglioPagamento[0].modalitaPagamento : null,
        "PaymentMethod": null,
        "InvoiceReference": headerInvoiceIntegrationInfo.invoiceReference ? headerInvoiceIntegrationInfo.invoiceReference : null,
        "InvoiceReferenceFiscalYear": headerInvoiceIntegrationInfo.invoiceReferenceFiscalYear ? headerInvoiceIntegrationInfo.invoiceReferenceFiscalYear : null,
        "HouseBank": headerInvoiceIntegrationInfo.houseBank ? headerInvoiceIntegrationInfo.houseBank : null,
        "HouseBankAccount": headerInvoiceIntegrationInfo.houseBankAccount ? headerInvoiceIntegrationInfo.houseBankAccount : null,
        "PaymentBlockingReason": headerInvoiceIntegrationInfo.paymentBlockingReason ? headerInvoiceIntegrationInfo.paymentBlockingReason : null,
        "PaymentReason": headerInvoiceIntegrationInfo.paymentReason ? headerInvoiceIntegrationInfo.paymentReason : null,
        "UnplannedDeliveryCost": headerInvoiceIntegrationInfo.unplannedDeliveryCost ? headerInvoiceIntegrationInfo.unplannedDeliveryCost : null,
        "DocumentHeaderText": headerInvoiceIntegrationInfo.documentHeaderText ? headerInvoiceIntegrationInfo.documentHeaderText : null,
        // "AccountingDocumentType": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_TipoDocumento ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_TipoDocumento : null,
        "AccountingDocumentType": null,
        "SupplyingCountry": headerFatturaElettronica.datiTrasmissione_IdPaese ? headerFatturaElettronica.datiTrasmissione_IdPaese : null,
        "AssignmentReference": headerInvoiceIntegrationInfo.assignmentReference ? headerInvoiceIntegrationInfo.assignmentReference : null,
        "IsEUTriangularDeal": headerInvoiceIntegrationInfo.IsEUTriangularDeal ? headerInvoiceIntegrationInfo.IsEUTriangularDeal : null,
        "TaxDeterminationDate": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data : null,
        "TaxReportingDate": headerInvoiceIntegrationInfo.taxReportingDate ? headerInvoiceIntegrationInfo.taxReportingDate : null,
        "TaxFulfillmentDate": headerInvoiceIntegrationInfo.taxFulfillmentDate ? headerInvoiceIntegrationInfo.taxFulfillmentDate : null,
        "To_SupplierInvoiceWhldgTax": aDataSupplierInvoiceWhldgTax,
        "Allegati": dataAllegati,
        "GLAccountRecords": aGLAccountRecords,
        "RefDocumentCategory": headerInvoiceIntegrationInfo.refDocumentCategory ? headerInvoiceIntegrationInfo.refDocumentCategory : null,
        "To_SelectedPurchaseOrders_PurchaseOrder": headerInvoiceIntegrationInfo.to_SelectedPurchaseOrders_PurchaseOrder ?  headerInvoiceIntegrationInfo.to_SelectedPurchaseOrders_PurchaseOrder : null,
        "To_SelectedPurchaseOrders_PurchaseOrderItem": headerInvoiceIntegrationInfo.to_SelectedPurchaseOrders_PurchaseOrderItem ?  headerInvoiceIntegrationInfo.to_SelectedPurchaseOrders_PurchaseOrderItem : null,
        "To_SelectedDeliveryNotes_InboundDeliveryNote": headerInvoiceIntegrationInfo.to_SelectedDeliveryNotes_InboundDeliveryNote ? headerInvoiceIntegrationInfo.to_SelectedDeliveryNotes_InboundDeliveryNote : null,
        "To_SelectedServiceEntrySheets_ServiceEntrySheet": headerInvoiceIntegrationInfo.to_SelectedServiceEntrySheets_ServiceEntrySheet ? headerInvoiceIntegrationInfo.to_SelectedServiceEntrySheets_ServiceEntrySheet : null,
        "To_SelectedServiceEntrySheets_ServiceEntrySheetItem": headerInvoiceIntegrationInfo.to_SelectedServiceEntrySheets_ServiceEntrySheetItem ? headerInvoiceIntegrationInfo.to_SelectedServiceEntrySheets_ServiceEntrySheetItem : null,
        "PORecords": aPORecords
    };
}

// Create a line item object for GL Account records
function createLineItemForGLAccount(index, oLineDetail, bodyFatturaElettronica) {
    return {
        "lineDetail_ID": oLineDetail.ID,
        "headerGLAccountIntegrationInfo_Id": oLineDetail.header_Id,
        "bodyInvoiceItalianTrace_Id": oLineDetail.body_Id,
        "bodyGLAccountIntegrationInfo_Id": oLineDetail.bodyGLAccountIntegrationInfo_ID,
        "SupplierInvoiceItem": String(index + 1).padStart(4, '0'),
        "CompanyCode": oLineDetail.companyCode ? oLineDetail.companyCode : null,
        "GLAccount": oLineDetail.glAccount ? oLineDetail.glAccount : null,
        "DebitCreditCode": oLineDetail.debitCreditCode ? oLineDetail.debitCreditCode : null,
        "DocumentCurrency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
        "SupplierInvoiceItemAmount": oLineDetail.supplierInvoiceItemAmount ? oLineDetail.supplierInvoiceItemAmount : null,
        "TaxCode": oLineDetail.taxCode ? oLineDetail.taxCode : null,
        "AssignmentReference": oLineDetail.assignmentReference ? oLineDetail.assignmentReference : null,
        "SupplierInvoiceItemText": oLineDetail.descrizione ? oLineDetail.descrizione : null,
        "CostCenter": oLineDetail.costCenter ? oLineDetail.costCenter : null,
        "BusinessArea": oLineDetail.businessArea ? oLineDetail.businessArea : null,
        "PartnerBusinessArea": oLineDetail.partnerBusinessArea ? oLineDetail.partnerBusinessArea : null,
        "ProfitCenter": oLineDetail.profitCenter ? oLineDetail.profitCenter : null,
        "FunctionalArea": oLineDetail.functionalArea ? oLineDetail.functionalArea : null,
        "SalesOrder": oLineDetail.salesOrder ? oLineDetail.salesOrder : null,
        "SalesOrderItem": oLineDetail.salesOrderItem ? oLineDetail.salesOrderItem : null,
        "CostCtrActivityType": oLineDetail.costCtrActivityType ? oLineDetail.costCtrActivityType : null,
        "WBSElement": oLineDetail.wBSElement ? oLineDetail.wBSElement : null,
        "PersonnelNumber": oLineDetail.personnelNumber ? oLineDetail.personnelNumber : null,
        "IsNotCashDiscountLiable": oLineDetail.isNotCashDiscountLiable ? oLineDetail.isNotCashDiscountLiable : null,
        "InternalOrder": oLineDetail.internalOrder ?  oLineDetail.internalOrder : null,
        "CommitmentItem": oLineDetail.commitmentItem ? oLineDetail.commitmentItem : null,
        "Fund": oLineDetail.fund ? oLineDetail.fund : null,
        "GrantID": oLineDetail.grantID ? oLineDetail.grantID : null,
        "QuantityUnit": oLineDetail.unitaMisura ? oLineDetail.unitaMisura : null,
        "Quantity": oLineDetail.quantita ? oLineDetail.quantita : null,
        "FinancialTransactionType": oLineDetail.financialTransactionType ? oLineDetail.financialTransactionType : null,
        "EarmarkedFundsDocument": oLineDetail.earmarkedFundsDocument ? oLineDetail.earmarkedFundsDocument : null,
        "EarmarkedFundsDocumentItem": oLineDetail.earmarkedFundsDocumentItem ? oLineDetail.earmarkedFundsDocumentItem : null,
        "BudgetPeriod": oLineDetail.budgetPeriod ? oLineDetail.budgetPeriod : null
    };
}

// Create a line item object for Purchase Order records
function createLineItemForPO(index, oLineDetail, bodyFatturaElettronica) {
    return {
        "lineDetail_ID": oLineDetail.ID,
        "headerPOtIntegrationInfo_Id": oLineDetail.header_Id,
        "bodyInvoiceItalianTrace_Id": oLineDetail.body_Id,
        "bodyPOIntegrationInfo_Id": oLineDetail.bodyPOIntegrationInfo_ID,
        "SupplierInvoiceItem": String(index).padStart(4, '0'),
        "PurchaseOrder": oLineDetail.purchaseOrder ? oLineDetail.purchaseOrder : null,
        "PurchaseOrderItem": oLineDetail.purchaseOrderItem ? oLineDetail.purchaseOrderItem : null,
        "Plant": oLineDetail.plant ? oLineDetail.plant : null,
        "IsSubsequentDebitCredit": oLineDetail.isSubsequentDebitCredit ? oLineDetail.isSubsequentDebitCredit : null,
        "TaxCode": oLineDetail.taxCode ? oLineDetail.taxCode : null,
        "DocumentCurrency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
        "SupplierInvoiceItemAmount": oLineDetail.prezzoTotale ? oLineDetail.prezzoTotale : null,
        // "PurchaseOrderQuantityUnit": oLineDetail.quantita ? oLineDetail.quantita : null,
        "PurchaseOrderQuantityUnit": null,
        "QuantityInPurchaseOrderUnit": oLineDetail.quantityInPurchaseOrderUnit ? oLineDetail.quantityInPurchaseOrderUnit : null,
        "QtyInPurchaseOrderPriceUnit": oLineDetail.qtyInPurchaseOrderPriceUnit ? oLineDetail.qtyInPurchaseOrderPriceUnit : null,
        // "PurchaseOrderPriceUnit": oLineDetail.prezzoUnitario ? oLineDetail.prezzoUnitario : null,
        "PurchaseOrderPriceUnit": null,
        "SupplierInvoiceItemText": oLineDetail.descrizione ? oLineDetail.descrizione : null,
        "IsNotCashDiscountLiable": oLineDetail.isNotCashDiscountLiable ? oLineDetail.isNotCashDiscountLiable : null,
        "ServiceEntrySheet": oLineDetail.serviceEntrySheet ? oLineDetail.serviceEntrySheet : null,
        "ServiceEntrySheetItem": oLineDetail.serviceEntrySheetItem ? oLineDetail.serviceEntrySheetItem : null,
        "IsFinallyInvoiced": oLineDetail.isFinallyInvoiced ? oLineDetail.isFinallyInvoiced : null,
        "TaxDeterminationDate": oLineDetail.taxDeterminationDate ? oLineDetail.taxDeterminationDate : null,
        "CostCenter":  oLineDetail.costCenter ? oLineDetail.costCenter : null,
        "ControllingArea": oLineDetail.controllingArea ? oLineDetail.controllingArea : null,
        "BusinessArea": oLineDetail.businessArea ? oLineDetail.businessArea : null,
        "ProfitCenter": oLineDetail.profitCenter ? oLineDetail.profitCenter : null,
        "FunctionalArea": oLineDetail.functionalArea ? oLineDetail.functionalArea : null,
        "WBSElement": oLineDetail.wBSElement ? oLineDetail.wBSElement : null,
        "SalesOrder": oLineDetail.salesOrder ? oLineDetail.salesOrder : null,
        "SalesOrderItem": oLineDetail.salesOrderItem ? oLineDetail.salesOrderItem : null,
        "InternalOrder": oLineDetail.internalOrder ?  oLineDetail.internalOrder : null,
        "CommitmentItem": oLineDetail.commitmentItem ? oLineDetail.commitmentItem : null,
        "FundsCenter": oLineDetail.fundsCenter ? oLineDetail.fundsCenter : null,
        "Fund": oLineDetail.fund ? oLineDetail.fund : null,
        "GrantID": oLineDetail.grantID ? oLineDetail.grantID : null,
        "ProfitabilitySegment": oLineDetail.profitabilitySegment ? oLineDetail.profitabilitySegment : null,
        "BudgetPeriod": oLineDetail.budgetPeriod ? oLineDetail.budgetPeriod : null
    };
}
