const transcoder = require('./utils/transcoders');

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
        const bodyData = await fetchBodyData(tx, headerData.headerFatturaElettronica.ID, headerData.headerInvoiceIntegrationInfo.ID);
        const paymentData = await fetchPaymentData(tx, bodyData.bodyFatturaElettronica.ID);

        const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
        const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
        // Construct and return the final result object with all retrieved data
        const result = await createResultObject(headerData, bodyData, paymentData, serviceRequestS4_HANA);
        return { status: 200, result: result, message: 'Executed' };
    } catch (err) {
        console.error(`Error during queries executions: ${err}`);
        return { status: 500, message: 'Internal server error' };
    }
};

// Fetch header data for a specific package
// Get error log during last submit attempt (if any)
async function fetchHeaderData(tx, packageId) {
    const errorLog = (await tx.run(
        SELECT('*').from('ERROR_LOG')
            .where({ PackageId: packageId })
            .orderBy('CreatedAt desc') // Order by CreatedAt in descending order
            .limit(1)                  // Limit the result to the last inserted record
    ));

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

    const dataSupplierInvoiceWhldgTax = (await tx.run(
        SELECT('*').from('SupplierInvoiceWhldgTax').where({ header_Id: headerInvoiceIntegrationInfo.ID })
    ));

    return { errorLog, headerFatturaElettronica, headerInvoiceIntegrationInfo, dataSupplierInvoiceWhldgTax };
}

// Fetch body data and related records based on header ID
async function fetchBodyData(tx, headerId, headerInvoiceIntegrationInfoId) {
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
        tx.run(SELECT('*').from('POIntegrationInfoBody').where({ header_Id: headerInvoiceIntegrationInfoId })),
        tx.run(SELECT('*').from('GLAccountIntegrationInfoBody').where({ header_Id: headerInvoiceIntegrationInfoId })),
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

/**
 * Merges PO line details with integration info body by matching based on IDs.
 * For each line in `dataDettaglioLinee`, if there is a matching object in `dataPOIntegrationInfoBody` (based on `bodyPOIntegrationInfo_ID`),
 * the properties from the matching object are merged into the line, excluding the key `ID`.
 * 
 * @param {Array} dataDettaglioLinee - Array of line detail objects.
 * @param {Array} dataPOIntegrationInfoBody - Array of integration info objects.
 * @returns {Array} - Array of line details with merged integration data.
 */
function mergePOLineDetailsWithIntegrationInfoBody(dataDettaglioLinee, dataPOIntegrationInfoBody) {
    // Filter out lines that do not have a `bodyPOIntegrationInfo_ID` property.
    let aDataDettaglioLineeForPOInvoices = dataDettaglioLinee.filter(line => line.bodyPOIntegrationInfo_ID);
    // Map over the filtered line details to enrich each one with data from `dataPOIntegrationInfoBody`.
    return aDataDettaglioLineeForPOInvoices.map(line => ({
        // Spread all properties of the current line into the result object.
        ...line,
        // Find the matching integration info object based on `bodyPOIntegrationInfo_ID`.
        ...(dataPOIntegrationInfoBody.find(info => info.ID === line.bodyPOIntegrationInfo_ID) &&

            // Merge properties from the matching integration object into the line object,
            // excluding the `ID` property to avoid conflicts.
            Object.fromEntries(Object.entries(dataPOIntegrationInfoBody.find(info => info.ID === line.bodyPOIntegrationInfo_ID)).filter(([key]) => key !== 'ID'))) || {} // Fallback to an empty object if no matching integration object is found.
    }));
}

/**
 * Merges GL Account line details with integration info body by matching based on IDs.
 * For each line in `dataDettaglioLinee`, if there is a matching object in `dataGLAccountIntegrationInfoBody` (based on `bodyGLAccountIntegrationInfo_ID`),
 * the properties from the matching object are merged into the line, excluding the key `ID`.
 * 
 * @param {Array} dataDettaglioLinee - Array of line detail objects.
 * @param {Array} dataGLAccountIntegrationInfoBody - Array of integration info objects.
 * @returns {Array} - Array of line details with merged integration data.
 */
function mergeGLAccountLineDetailsWithIntegrationInfoBody(dataDettaglioLinee, dataGLAccountIntegrationInfoBody) {
    // Filter out lines that do not have a `bodyGLAccountIntegrationInfo_ID` property.
    let aDataDettaglioLineeForGLAccount = dataDettaglioLinee.filter(line => line.bodyGLAccountIntegrationInfo_ID);
    // Map over the filtered line details to enrich each one with data from `dataGLAccountIntegrationInfoBody`.
    return aDataDettaglioLineeForGLAccount.map(line => ({
        // Spread all properties of the current line into the result object.
        ...line,
        // Find the matching integration info object based on `bodyGLAccountIntegrationInfo_ID`.
        ...(dataGLAccountIntegrationInfoBody.find(info => info.ID === line.bodyGLAccountIntegrationInfo_ID) &&

            // Merge properties from the matching integration object into the line object,
            // excluding the `ID` property to avoid conflicts.
            Object.fromEntries(Object.entries(dataGLAccountIntegrationInfoBody.find(info => info.ID === line.bodyGLAccountIntegrationInfo_ID)).filter(([key]) => key !== 'ID'))) || {} // Fallback to an empty object if no matching integration object is found.
    }));
}

function getAccountingDocumentType(sBodyDocumentType) { // In the future will be a request to a transcoder service, but currently it is just a placeholder.
    return transcoder.accountingDocumentType[sBodyDocumentType];
}

function getIVA(sTaxCode) {
    if (!sTaxCode) {
        let nIVA = transcoder.aliquotaIVA[sTaxCode];
        if (nIVA) {
            return nIVA
        }
    }
    return 0.00;
}

function calculateAmountSummary(aPORecords, aGLAccountRecords) {
    var oAmountSummary = {
            TotalNetAmount: 0, 
            TotalTaxAmount: 0, 
            TotalGrossAmount: 0,
            Summary: []
        },
        oTaxCodeSet = new Set();

    aPORecords.forEach(record => {
        oTaxCodeSet.add(record.TaxCode);
    });
    aGLAccountRecords.forEach(record => {
        oTaxCodeSet.add(record.TaxCode);
    });

    const aTaxCodes = Array.from(oTaxCodeSet);
    aTaxCodes.forEach(sTaxCode => {
        let nNetAmount = 0,
            nTaxAmount = 0,
            nGrossAmount = 0,
            nIVA = getIVA(sTaxCode);

        aPORecords.forEach(record => {
            // Perform calculations or manipulations with each GL account record based on the tax code
            if (record.TaxCode === sTaxCode) {
                if (record.SupplierInvoiceItemAmount !== null) {
                    nNetAmount += parseFloat(record.SupplierInvoiceItemAmount);
                    nTaxAmount += parseFloat(record.SupplierInvoiceItemAmount) * nIVA; 
                    nGrossAmount += parseFloat(record.SupplierInvoiceItemAmount) + nIVA; 
                }
            }
        })

        aGLAccountRecords.forEach(record => {
            // Perform calculations or manipulations with each GL account record based on the tax code
            if (record.TaxCode === sTaxCode) {
                if (record.SupplierInvoiceItemAmount !== null) {
                    nNetAmount += parseFloat(record.SupplierInvoiceItemAmount);
                    nTaxAmount += parseFloat(record.SupplierInvoiceItemAmount) * nIVA; 
                    nGrossAmount += parseFloat(record.SupplierInvoiceItemAmount) + nIVA; 
                }
            }
        });

        oAmountSummary.Summary.push({
            TaxCode: sTaxCode,
            NetAmount: nNetAmount.toFixed(2),
            TaxAmount: nTaxAmount.toFixed(2),
            GrossAmount: nGrossAmount.toFixed(2)
        })
    });

    oAmountSummary.Summary.forEach(record => {
        oAmountSummary.TotalNetAmount += parseFloat(record.NetAmount);
        oAmountSummary.TotalTaxAmount += parseFloat(record.TaxAmount);
        oAmountSummary.TotalGrossAmount += parseFloat(record.GrossAmount);
    });
    
    oAmountSummary.TotalNetAmount = oAmountSummary.TotalNetAmount.toFixed(2);
    oAmountSummary.TotalTaxAmount = oAmountSummary.TotalTaxAmount.toFixed(2);
    oAmountSummary.TotalGrossAmount = oAmountSummary.TotalGrossAmount.toFixed(2);
    return oAmountSummary;
}

// Create the result object containing all invoice details
async function createResultObject(headerData, bodyData, paymentData, serviceRequestS4_HANA) {
    const { errorLog, headerFatturaElettronica, headerInvoiceIntegrationInfo, dataSupplierInvoiceWhldgTax } = headerData;
    const { bodyFatturaElettronica, dataDatiRitenuta, dataDatiOrdineAcquisto, dataDettaglioLinee, dataDatiRiepilogo, dataDatiPagamento, dataAllegati, dataPOIntegrationInfoBody, dataGLAccountIntegrationInfoBody } = bodyData;
    const { dataDettaglioPagamento } = paymentData;
    const aLineDetailsMergedWithPOIntegrations = mergePOLineDetailsWithIntegrationInfoBody(dataDettaglioLinee, dataPOIntegrationInfoBody);
    const aLineDetailsMergedWithGLAccountIntegrations = mergeGLAccountLineDetailsWithIntegrationInfoBody(dataDettaglioLinee, dataGLAccountIntegrationInfoBody);

    const sAccountingDocumentType = await getAccountingDocumentType(bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_TipoDocumento);
    const sCompanyCode = headerInvoiceIntegrationInfo.companyCode ? headerInvoiceIntegrationInfo.companyCode : null;
    const sTaxDeterminationDate = headerInvoiceIntegrationInfo.taxDeterminationDate ? headerInvoiceIntegrationInfo.taxDeterminationDate : bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data;
    // Generate arrays for GL Account and Purchase Order records
    const aGLAccountRecords = aLineDetailsMergedWithGLAccountIntegrations.map((line, index) => createLineItemForGLAccount(index + 1, line, bodyFatturaElettronica, sCompanyCode));

    const aPORecords = await Promise.all(aLineDetailsMergedWithPOIntegrations.map((line, index) => createLineItemForPO(index + 1, line, bodyFatturaElettronica, serviceRequestS4_HANA, sCompanyCode, headerInvoiceIntegrationInfo)));

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

    const oDataAmountSummary = calculateAmountSummary(aPORecords, aGLAccountRecords);

    // Assemble final result object with all relevant data fields
    return {
        "header_Id_ItalianInvoiceTrace": headerFatturaElettronica.ID,
        "header_Id_InvoiceIntegrationInfo": headerInvoiceIntegrationInfo.ID,
        "Transaction": headerInvoiceIntegrationInfo.transaction ? headerInvoiceIntegrationInfo.transaction : 'Invoice',
        "CompanyCode": sCompanyCode,
        "DocumentDate": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Data : null,
        "InvoiceReceiptDate": headerInvoiceIntegrationInfo.invoiceReceiptDate ? headerInvoiceIntegrationInfo.invoiceReceiptDate : null,
        "PostingDate": headerInvoiceIntegrationInfo.postingDate ? headerInvoiceIntegrationInfo.postingDate : null,
        "InvoicingParty": headerInvoiceIntegrationInfo.invoicingParty ? headerInvoiceIntegrationInfo.invoicingParty : null,
        "Currency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
        "SupplierInvoiceIDByInvcgParty": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Numero ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Numero : null,
        "InvoiceGrossAmount": parseFloat(bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento),
        "SupplierPostingLineItemText": headerInvoiceIntegrationInfo.supplierPostingLineItemText ? headerInvoiceIntegrationInfo.supplierPostingLineItemText : null,
        "TaxIsCalculatedAutomatically": headerInvoiceIntegrationInfo.taxIsCalculatedAutomatically ? headerInvoiceIntegrationInfo.taxIsCalculatedAutomatically : null,
        "DueCalculationBaseDate": headerInvoiceIntegrationInfo.dueCalculationBaseDate ? headerInvoiceIntegrationInfo.dueCalculationBaseDate : null,
        "ManualCashDiscount": headerInvoiceIntegrationInfo.manualCashDiscount ? headerInvoiceIntegrationInfo.manualCashDiscount : null,
        "PaymentTerms": headerInvoiceIntegrationInfo.paymentTerms ? headerInvoiceIntegrationInfo.paymentTerms : null,
        "CashDiscount1Days": headerInvoiceIntegrationInfo.cashDiscount1Days != null ? headerInvoiceIntegrationInfo.cashDiscount1Days : null,
        "CashDiscount1Percent": headerInvoiceIntegrationInfo.cashDiscount1Percent ? headerInvoiceIntegrationInfo.cashDiscount1Percent : null,
        "CashDiscount2Days": headerInvoiceIntegrationInfo.cashDiscount2Days != null ? headerInvoiceIntegrationInfo.cashDiscount2Days : null,
        "CashDiscount2Percent": headerInvoiceIntegrationInfo.cashDiscount2Percent ? headerInvoiceIntegrationInfo.cashDiscount2Percent : null,
        "FixedCashDiscount": headerInvoiceIntegrationInfo.fixedCashDiscount ? headerInvoiceIntegrationInfo.fixedCashDiscount : null,
        "NetPaymentDays": headerInvoiceIntegrationInfo.netPaymentDays != null ? headerInvoiceIntegrationInfo.netPaymentDays : null,
        "BPBankAccountInternalID": headerInvoiceIntegrationInfo.bPBankAccountInternalID ? headerInvoiceIntegrationInfo.bPBankAccountInternalID : null,
        "PaymentMethod": headerInvoiceIntegrationInfo.paymentMethod ? headerInvoiceIntegrationInfo.paymentMethod : null,
        "InvoiceReference": headerInvoiceIntegrationInfo.invoiceReference ? headerInvoiceIntegrationInfo.invoiceReference : null,
        "InvoiceReferenceFiscalYear": headerInvoiceIntegrationInfo.invoiceReferenceFiscalYear ? headerInvoiceIntegrationInfo.invoiceReferenceFiscalYear : null,
        "HouseBank": headerInvoiceIntegrationInfo.houseBank ? headerInvoiceIntegrationInfo.houseBank : null,
        "HouseBankAccount": headerInvoiceIntegrationInfo.houseBankAccount ? headerInvoiceIntegrationInfo.houseBankAccount : null,
        "PaymentBlockingReason": headerInvoiceIntegrationInfo.paymentBlockingReason ? headerInvoiceIntegrationInfo.paymentBlockingReason : null,
        "PaymentReason": headerInvoiceIntegrationInfo.paymentReason ? headerInvoiceIntegrationInfo.paymentReason : null,
        "UnplannedDeliveryCost": headerInvoiceIntegrationInfo.unplannedDeliveryCost ? headerInvoiceIntegrationInfo.unplannedDeliveryCost : null,
        "DocumentHeaderText": headerInvoiceIntegrationInfo.documentHeaderText ? headerInvoiceIntegrationInfo.documentHeaderText : null,
        "AccountingDocumentType": headerInvoiceIntegrationInfo.accountingDocumentType ? headerInvoiceIntegrationInfo.accountingDocumentType : sAccountingDocumentType,
        "SupplyingCountry": headerFatturaElettronica.datiTrasmissione_IdPaese ? headerFatturaElettronica.datiTrasmissione_IdPaese : null,
        "AssignmentReference": headerInvoiceIntegrationInfo.assignmentReference ? headerInvoiceIntegrationInfo.assignmentReference : null,
        "IsEUTriangularDeal": headerInvoiceIntegrationInfo.isEUTriangularDeal ? headerInvoiceIntegrationInfo.isEUTriangularDeal : null,
        "TaxDeterminationDate": sTaxDeterminationDate,
        "TaxReportingDate": headerInvoiceIntegrationInfo.taxReportingDate ? headerInvoiceIntegrationInfo.taxReportingDate : null,
        "TaxFulfillmentDate": headerInvoiceIntegrationInfo.taxFulfillmentDate ? headerInvoiceIntegrationInfo.taxFulfillmentDate : null,
        "To_SupplierInvoiceWhldgTax": aDataSupplierInvoiceWhldgTax,
        "AmountSummary": oDataAmountSummary,
        "Allegati": dataAllegati,
        "GLAccountRecords": aGLAccountRecords,
        "PORecords": aPORecords,
        "ErrorLog": errorLog
    };
}

function getTaxCode(aliquotaIVA, natura) {
    if (!natura) {
        return transcoder.taxCode[aliquotaIVA];
    } else if (aliquotaIVA === 0.00) {
        return transcoder.taxCode[aliquotaIVA][natura];
    }
    return null;
}

// Create a line item object for GL Account records
function createLineItemForGLAccount(index, oLineDetail, bodyFatturaElettronica, sCompanyCode) {
    return {
        "lineDetail_ID": oLineDetail.ID,
        "headerGLAccountIntegrationInfo_Id": oLineDetail.header_Id,
        "bodyInvoiceItalianTrace_Id": oLineDetail.body_Id,
        "lineNumber": oLineDetail.numeroLinea,
        "bodyGLAccountIntegrationInfo_Id": oLineDetail.bodyGLAccountIntegrationInfo_ID,
        "SupplierInvoiceItem": String(index + 1).padStart(4, '0'),
        "CompanyCode": sCompanyCode,
        "GLAccount": oLineDetail.glAccount ? oLineDetail.glAccount : null,
        "DebitCreditCode": oLineDetail.debitCreditCode ? oLineDetail.debitCreditCode : null,
        "DocumentCurrency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
        "SupplierInvoiceItemAmount": oLineDetail.prezzoTotale ? oLineDetail.prezzoTotale : null,
        "TaxCode": oLineDetail.taxCode ? oLineDetail.taxCode : getTaxCode(oLineDetail.aliquotaIVA, oLineDetail.natura),
        "AssignmentReference": oLineDetail.assignmentReference ? oLineDetail.assignmentReference : null,
        "SupplierInvoiceItemText": oLineDetail.supplierInvoiceItemText ? oLineDetail.supplierInvoiceItemText : null,
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
        "InternalOrder": oLineDetail.internalOrder ? oLineDetail.internalOrder : null,
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
async function createLineItemForPO(index, oLineDetail, bodyFatturaElettronica, serviceRequestS4_HANA, sCompanyCode, headerInvoiceIntegrationInfo) {
    let sReferenceDocument = null,
        sReferenceDocumentFiscalYear = null,
        sReferenceDocumentItem = null, 
        sPlant = null,
        bIsFinallyInvoiced = null,
        sCostCenter = null,
        sControllingArea = null,
        sBusinessArea = null,
        sProfitCenter = null,
        sFunctionalArea = null,
        sWBSElement = null,
        sSalesOrder = null,
        sSalesOrderItem = null,
        sInternalOrder = null,
        sCommitmentItem = null,
        sFund = null,
        sFundsCenter = null,
        sGrantID = null,
        sProfitabilitySegment = null,
        sBudgetPeriod = null,
        sAccountAssignmentNumber = null,
        sIsSubsequentDebitCredit = headerInvoiceIntegrationInfo.transaction === 'Invoice' ||  headerInvoiceIntegrationInfo.transaction === null ? '' : 'X';
    let oResultAccountAssignmentRequest = null;
    if (oLineDetail.purchaseOrder && oLineDetail.purchaseOrderItem) {
        oResultAccountAssignmentRequest = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_POACCOUNTASSIGNMENT_CDS'] + "&$filter=PurchaseOrder eq '" + oLineDetail.purchaseOrder + "' and PurchaseOrderItem eq '" + oLineDetail.purchaseOrderItem + "'");
        if (oResultAccountAssignmentRequest[0]) {
            sCostCenter = oResultAccountAssignmentRequest[0].CostCenter != "" ? oResultAccountAssignmentRequest[0].CostCenter : null;
            sControllingArea = oResultAccountAssignmentRequest[0].ControllingArea != "" ? oResultAccountAssignmentRequest[0].ControllingArea : null;
            sBusinessArea = oResultAccountAssignmentRequest[0].BusinessArea != "" ? oResultAccountAssignmentRequest[0].BusinessArea : null;
            sProfitCenter = oResultAccountAssignmentRequest[0].ProfitCenter != "" ? oResultAccountAssignmentRequest[0].ProfitCenter : null;
            sFunctionalArea = oResultAccountAssignmentRequest[0].FunctionalArea != "" ? oResultAccountAssignmentRequest[0].FunctionalArea : null;
            sWBSElement = oResultAccountAssignmentRequest[0].WBSElementInternalID_2 != "" ? oResultAccountAssignmentRequest[0].WBSElementInternalID_2 : null;
            sSalesOrder = oResultAccountAssignmentRequest[0].SalesOrder != "" ? oResultAccountAssignmentRequest[0].SalesOrder : null;
            sSalesOrderItem = oResultAccountAssignmentRequest[0].SalesOrderItem != "" ? oResultAccountAssignmentRequest[0].SalesOrderItem : null;
            sInternalOrder = oResultAccountAssignmentRequest[0].OrderInternalID != "" ? oResultAccountAssignmentRequest[0].OrderInternalID : null;
            sCommitmentItem = oResultAccountAssignmentRequest[0].CommitmentItemShortID != "" ? oResultAccountAssignmentRequest[0].CommitmentItemShortID : null;
            sFund = oResultAccountAssignmentRequest[0].Fund != "" ? oResultAccountAssignmentRequest[0].Fund : null;
            sFundsCenter = oResultAccountAssignmentRequest[0].FundsCenter != "" ? oResultAccountAssignmentRequest[0].FundsCenter : null;
            sGrantID = oResultAccountAssignmentRequest[0].GrantID != "" ? oResultAccountAssignmentRequest[0].GrantID : null;
            sProfitabilitySegment = oResultAccountAssignmentRequest[0].ProfitabilitySegment_2 != "" ? oResultAccountAssignmentRequest[0].ProfitabilitySegment_2 : null;
            sBudgetPeriod = oResultAccountAssignmentRequest[0].BudgetPeriod != "" ? oResultAccountAssignmentRequest[0].BudgetPeriod : null;
            sAccountAssignmentNumber = oResultAccountAssignmentRequest[0].AccountAssignmentNumber !== "" ? oResultAccountAssignmentRequest[0].AccountAssignmentNumber  : null 
        }
    }
    let oResultPurchaseOrderItemRefRequest = null;
    let oResultGoodsMovements = null;
    if (sCompanyCode && oLineDetail.purchaseOrder && oLineDetail.purchaseOrderItem) {
        oResultPurchaseOrderItemRefRequest = await serviceRequestS4_HANA.get(process.env['Path_API_purchaseorder'] + "/" + oLineDetail.purchaseOrder + "/" + process.env['Path_API_purchaseorder_2'] + "&$filter=CompanyCode eq '" + sCompanyCode + "' and PurchaseOrderItem eq '" + oLineDetail.purchaseOrderItem + "'")
        if (oResultPurchaseOrderItemRefRequest.value.length>0) {
            sPlant = oResultPurchaseOrderItemRefRequest.value[0].Plant;
            bIsFinallyInvoiced = oResultPurchaseOrderItemRefRequest.value[0].IsFinallyInvoiced;

            if (oResultPurchaseOrderItemRefRequest.value[0].InvoiceIsGoodsReceiptBased) {
                oResultGoodsMovements = await serviceRequestS4_HANA.get(process.env['Path_API_YY1_GOODSMOVEMENTS_CDS'] + "&$filter=PurchaseOrder eq '" + oLineDetail.purchaseOrder + "' and PurchaseOrderItem eq '" + oLineDetail.purchaseOrderItem + "'");
                sReferenceDocument = oResultGoodsMovements[0]?.MaterialDocument;
                sReferenceDocumentFiscalYear = oResultGoodsMovements[0]?.MaterialDocumentYear;
                sReferenceDocumentItem = oResultGoodsMovements[0]?.MaterialDocumentItem;
            }
        }
    }

    return {
        "lineDetail_ID": oLineDetail.ID,
        "headerPOIntegrationInfo_Id": oLineDetail.header_Id,
        "bodyInvoiceItalianTrace_Id": oLineDetail.body_Id,
        "lineNumber": oLineDetail.numeroLinea,
        "bodyPOIntegrationInfo_Id": oLineDetail.bodyPOIntegrationInfo_ID,
        "SupplierInvoiceItem": String(index).padStart(4, '0'),
        "PurchaseOrder": oLineDetail.purchaseOrder ? oLineDetail.purchaseOrder : null,
        "PurchaseOrderItem": oLineDetail.purchaseOrderItem ? oLineDetail.purchaseOrderItem : null,
        "ReferenceDocument": oLineDetail.referenceDocument ? oLineDetail.referenceDocument : sReferenceDocument,
        "ReferenceDocumentFiscalYear": oLineDetail.referenceDocumentFiscalYear ?  oLineDetail.referenceDocumentFiscalYear : sReferenceDocumentFiscalYear,
        "ReferenceDocumentItem": oLineDetail.referenceDocumentItem ? oLineDetail.referenceDocumentItem : sReferenceDocumentItem,
        "Plant": oLineDetail.plant ? oLineDetail.plant : sPlant,
        "IsSubsequentDebitCredit": oLineDetail.isSubsequentDebitCredit ? oLineDetail.isSubsequentDebitCredit : sIsSubsequentDebitCredit,
        "TaxCode": oLineDetail.taxCode ? oLineDetail.taxCode : getTaxCode(oLineDetail.aliquotaIVA, oLineDetail.natura),
        "DocumentCurrency": bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa ? bodyFatturaElettronica.datiGenerali_DatiGeneraliDocumento_Divisa : null,
        "SupplierInvoiceItemAmount": oLineDetail.prezzoTotale ? oLineDetail.prezzoTotale : null,
        "PurchaseOrderQuantityUnit": oLineDetail.unitaMisura !== null ? oLineDetail.unitaMisura : null,
        "QuantityInPurchaseOrderUnit": oLineDetail.quantita !== null ? oLineDetail.quantita : null,
        "QtyInPurchaseOrderPriceUnit": oLineDetail.qtyInPurchaseOrderPriceUnit ? oLineDetail.qtyInPurchaseOrderPriceUnit : null,
        "PurchaseOrderPriceUnit": oLineDetail.purchaseOrderPriceUnit !== null ? oLineDetail.purchaseOrderPriceUnit : null,
        "SupplierInvoiceItemText": oLineDetail.supplierInvoiceItemText ? oLineDetail.supplierInvoiceItemText : null,
        "IsNotCashDiscountLiable": oLineDetail.isNotCashDiscountLiable ? oLineDetail.isNotCashDiscountLiable : null,
        "ServiceEntrySheet": oLineDetail.serviceEntrySheet ? oLineDetail.serviceEntrySheet : null,
        "ServiceEntrySheetItem": oLineDetail.serviceEntrySheetItem ? oLineDetail.serviceEntrySheetItem : null,
        "IsFinallyInvoiced": oLineDetail.isFinallyInvoiced ? oLineDetail.isFinallyInvoiced : bIsFinallyInvoiced,
        "TaxDeterminationDate": oLineDetail.taxDeterminationDate ? oLineDetail.taxDeterminationDate : null,
        "CostCenter": oLineDetail.costCenter ? oLineDetail.costCenter : sCostCenter,
        "ControllingArea": oLineDetail.controllingArea ? oLineDetail.controllingArea : sControllingArea,
        "BusinessArea": oLineDetail.businessArea ? oLineDetail.businessArea : sBusinessArea,
        "ProfitCenter": oLineDetail.profitCenter ? oLineDetail.profitCenter : sProfitCenter,
        "FunctionalArea": oLineDetail.functionalArea ? oLineDetail.functionalArea : sFunctionalArea,
        "WBSElement": oLineDetail.wBSElement ? oLineDetail.wBSElement : sWBSElement,
        "SalesOrder": oLineDetail.salesOrder ? oLineDetail.salesOrder : sSalesOrder,
        "SalesOrderItem": oLineDetail.salesOrderItem ? oLineDetail.salesOrderItem : sSalesOrderItem,
        "InternalOrder": oLineDetail.internalOrder ? oLineDetail.internalOrder : sInternalOrder,
        "CommitmentItem": oLineDetail.commitmentItem ? oLineDetail.commitmentItem : sCommitmentItem,
        "FundsCenter": oLineDetail.fundsCenter ? oLineDetail.fundsCenter : sFundsCenter,
        "Fund": oLineDetail.fund ? oLineDetail.fund : sFund,
        "GrantID": oLineDetail.grantID ? oLineDetail.grantID : sGrantID,
        "ProfitabilitySegment": oLineDetail.profitabilitySegment ? oLineDetail.profitabilitySegment : sProfitabilitySegment,
        "BudgetPeriod": oLineDetail.budgetPeriod ? oLineDetail.budgetPeriod : sBudgetPeriod,
        "AccountAssignmentNumber": oLineDetail.accountAssignmentNumber ? oLineDetail.accountAssignmentNumber : sAccountAssignmentNumber 
    };
}
