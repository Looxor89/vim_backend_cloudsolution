const { checkSaveScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const { v4: uuidv4 } = require('uuid');

"use strict";

module.exports = async (request, tx) => {
    const { PackageId,
        Invoice,
        RemovedSupplierInvoiceWhldgTaxRecords,
        RemovedPoLineDetails,
        RemovedGlAccountLineDetails } = request.data.payload;
    const modifiedBy = request.req.authInfo.getLogonName();
    const modifiedAt = new Date();

    let jsonInvoice;

    try {
        jsonInvoice = JSON.parse(Invoice);
    } catch (err) {
        console.error('Failed to parse invoice JSON:', err);
        return { status: 422, message: 'Invalid Invoice JSON' }
    }

    const valid = validateInvoice(jsonInvoice);
    if (!valid.status) {
        return { status: 422, message: valid.message }
    }

    const aNewSupplierInvoiceWhldgTaxRecords = jsonInvoice.To_SupplierInvoiceWhldgTax.filter(oItem => oItem.supplierInvoiceWhldgTax_Id  === null);
    const aNewPoLineDetails = jsonInvoice.PORecords.filter(oLineDetail => oLineDetail.lineDetail_ID  === null);
    const aNewGlAccountLineDetails = jsonInvoice.GLAccountRecords.filter(oLineDetail => oLineDetail.lineDetail_ID  === null);

    try {
        await handleAttachments(jsonInvoice.Allegati, tx);
        await updateHeaders(jsonInvoice, tx);
        await updateBodies(jsonInvoice, tx);
        await updatePaymentDetails(jsonInvoice, tx);
        await updateLineDetails(jsonInvoice, tx);
        await updateDocPack(modifiedBy, modifiedAt, PackageId, tx);
        await insertSupplierInvoiceWhldgTaxRecords(jsonInvoice, aNewSupplierInvoiceWhldgTaxRecords, tx);
        await insertLineDetails(jsonInvoice, aNewPoLineDetails, aNewGlAccountLineDetails, tx);
        await deleteSupplierInvoiceWhldgTaxRecords(RemovedSupplierInvoiceWhldgTaxRecords, tx);
        await deleteLineDetails(RemovedPoLineDetails, RemovedGlAccountLineDetails, tx);

        return { status: 201, message: 'Data stored in database' }
    } catch (err) {
        console.error('Error during save operation:', err);
        await tx.rollback(err);
        return { status: 500, message: 'Internal Server Error' }
    }
};

// Helper function to validate the invoice
function validateInvoice(invoice) {
    const { error } = schema.action_save_submit.validate(invoice, { abortEarly: false });
    let valid = error == null;
    let details = error ? error.message : null;
    return { status: valid, message: details };
}

// Handle attachment updates
async function handleAttachments(attachments, tx) {
    if (!attachments || attachments.length === 0) return;
    for (const attachment of attachments) {
        const query = UPDATE('Allegati')
            .set(attachment)
            .where({ ID: attachment.ID });
        await executeQuery(tx, query);
    }
}

// Update main records
async function updateHeaders(jsonInvoice, tx) {
    const fatturaQuery = UPDATE('FatturaElettronica')
        .set({ "datiTrasmissione_IdPaese": jsonInvoice.SupplyingCountry })
        .where(`ID = '${jsonInvoice.header_Id_ItalianInvoiceTrace}'`);

    const invoiceQuery = UPDATE('InvoiceIntegrationInfo')
        .set({
            "transaction": jsonInvoice.Transaction,
            "companyCode": jsonInvoice.CompanyCode,
            "invoiceReceiptDate": jsonInvoice.InvoiceReceiptDate,
            "postingDate": jsonInvoice.PostingDate,
            "invoicingParty": jsonInvoice.InvoicingParty,
            "supplierPostingLineItemText": jsonInvoice.SupplierPostingLineItemText,
            "taxIsCalculatedAutomatically": jsonInvoice.TaxIsCalculatedAutomatically,
            "dueCalculationBaseDate": jsonInvoice.DueCalculationBaseDate,
            "manualCashDiscount": jsonInvoice.ManualCashDiscount,
            "paymentTerms": jsonInvoice.PaymentTerms,
            "cashDiscount1Days": jsonInvoice.CashDiscount1Days,
            "cashDiscount1Percent": jsonInvoice.CashDiscount1Percent,
            "cashDiscount2Days": jsonInvoice.CashDiscount2Days,
            "fixedCashDiscount": jsonInvoice.FixedCashDiscount,
            "netPaymentDays": jsonInvoice.NetPaymentDays,
            "bPBankAccountInternalID": jsonInvoice.BPBankAccountInternalID,
            "invoiceReference": jsonInvoice.InvoiceReference,
            "invoiceReferenceFiscalYear": jsonInvoice.InvoiceReferenceFiscalYear,
            "houseBank": jsonInvoice.HouseBank,
            "houseBankAccount": jsonInvoice.HouseBankAccount,
            "paymentBlockingReason": jsonInvoice.PaymentBlockingReason,
            "paymentReason": jsonInvoice.PaymentReason,
            "unplannedDeliveryCost": jsonInvoice.UnplannedDeliveryCost,
            "documentHeaderText": jsonInvoice.DocumentHeaderText,
            "assignmentReference": jsonInvoice.AssignmentReference,
            "isEUTriangularDeal": jsonInvoice.IsEUTriangularDeal,
            "taxReportingDate": jsonInvoice.TaxReportingDate,
            "taxFulfillmentDate": jsonInvoice.TaxFulfillmentDate,
            "refDocumentCategory": jsonInvoice.RefDocumentCategory,
            "to_SelectedPurchaseOrders_PurchaseOrder": jsonInvoice.To_SelectedPurchaseOrders_PurchaseOrder,
            "to_SelectedPurchaseOrders_PurchaseOrderItem": jsonInvoice.To_SelectedPurchaseOrders_PurchaseOrderItem,
            "to_SelectedDeliveryNotes_InboundDeliveryNote": jsonInvoice.To_SelectedDeliveryNotes_InboundDeliveryNote,
            "to_SelectedServiceEntrySheets_ServiceEntrySheet": jsonInvoice.To_SelectedServiceEntrySheets_ServiceEntrySheet,
            "to_SelectedServiceEntrySheets_ServiceEntrySheetItem": jsonInvoice.To_SelectedServiceEntrySheets_ServiceEntrySheetItem
        })
        .where(`ID = '${jsonInvoice.header_Id_InvoiceIntegrationInfo}'`);

    await executeQuery(tx, fatturaQuery);
    await executeQuery(tx, invoiceQuery);

    for (const oSupplierInvoiceWhldgTax of jsonInvoice.To_SupplierInvoiceWhldgTax) {
        if (oSupplierInvoiceWhldgTax.supplierInvoiceWhldgTax_Id) {
            const lineSupplierInvoiceWhldgTaxQuery = UPDATE('SupplierInvoiceWhldgTax')
                .set({
                    "ID": oSupplierInvoiceWhldgTax.supplierInvoiceWhldgTax_Id,
                    "header_Id": oSupplierInvoiceWhldgTax.header_Id_InvoiceIntegrationInfo,
                    "withholdingTaxType": oSupplierInvoiceWhldgTax.WithholdingTaxType,
                    "withholdingTaxCode": oSupplierInvoiceWhldgTax.WithholdingTaxCode,
                    "withholdingTaxBaseAmount": oSupplierInvoiceWhldgTax.WithholdingTaxBaseAmount,
                    "whldgTaxBaseIsEnteredManually": oSupplierInvoiceWhldgTax.WhldgTaxBaseIsEnteredManually
                })
                .where(`ID = '${oSupplierInvoiceWhldgTax.supplierInvoiceWhldgTax_Id}'`);
            await executeQuery(tx, lineSupplierInvoiceWhldgTaxQuery);
        }
    }
}

// Update invoice body details
async function updateBodies(invoice, tx) {
    const bodyId = invoice.PORecords.length > 0
        ? invoice.PORecords[0].bodyInvoiceItalianTrace_Id
        : invoice.GLAccountRecords[0].bodyInvoiceItalianTrace_Id;

    const queryFatturaElettronicaBody = UPDATE('FatturaElettronicaBody')
        .set({
            datiGenerali_DatiGeneraliDocumento_Data: invoice.DocumentDate,
            datiGenerali_DatiGeneraliDocumento_Divisa: invoice.Currency,
            datiGenerali_DatiGeneraliDocumento_Numero: invoice.SupplierInvoiceIDByInvcgParty,
            datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento: invoice.InvoiceGrossAmount,
            datiGenerali_DatiGeneraliDocumento_TipoDocumento: invoice.AccountingDocumentType
        })
        .where({ ID: bodyId });

    await executeQuery(tx, queryFatturaElettronicaBody);
}

// Update payment details
async function updatePaymentDetails(invoice, tx) {
    const bodyId = invoice.PORecords.length > 0
        ? invoice.PORecords[0].bodyInvoiceItalianTrace_Id
        : invoice.GLAccountRecords[0].bodyInvoiceItalianTrace_Id;
    const paymentData = await executeQuery(tx, SELECT('ID').from('DatiPagamento').where({ body_Id: bodyId }));

    for (const oPaymentData of paymentData) {
        const query = UPDATE('DettaglioPagamento')
            .set({ "modalitaPagamento": invoice.PaymentMethod })
            .where(`datiPagamento_Id = '${oPaymentData.ID}'`);
        await executeQuery(tx, query);
    }
}

// Update line details for PO and GL Account records
async function updateLineDetails(invoice, tx) {
    await updatePOLineDetails(invoice.PORecords, tx);
    await updateGLAccountLineDetails(invoice.GLAccountRecords, tx);
}

// Insert records into SupplierInvoiceWhldgTax if any
async function insertSupplierInvoiceWhldgTaxRecords(invoice, aNewSupplierInvoiceWhldgTaxRecords, tx) {
    var aNewRecords = [];
    aNewRecords = aNewSupplierInvoiceWhldgTaxRecords.map(record => ({
        ID: uuidv4(),
        header_Id: record.header_Id_InvoiceIntegrationInfo,
        withholdingTaxType: record.WithholdingTaxType,
        withholdingTaxCode: record.WithholdingTaxCode,
        withholdingTaxBaseAmount: record.WithholdingTaxBaseAmount,
        whldgTaxBaseIsEnteredManually: record.WhldgTaxBaseIsEnteredManually
    }));
    
    if (aNewRecords.length > 0) {
        const lineQuery = INSERT.into('SupplierInvoiceWhldgTax')
            .entries(aNewRecords);

        await executeQuery(tx, lineQuery);
    }
}

// Insert line details for PO and GL Account records if any
async function insertLineDetails(invoice, aNewPoLineDetails, aNewGlAccountLineDetails, tx) {
    await insertPOLineDetails(aNewPoLineDetails, invoice.header_Id_InvoiceIntegrationInfo, tx);
    await insertGLAccountLineDetails(aNewGlAccountLineDetails, invoice.header_Id_InvoiceIntegrationInfo, tx);
}

// Delete records for SupplierInvoiceWhldgTax if any
async function deleteSupplierInvoiceWhldgTaxRecords(RemovedSupplierInvoiceWhldgTaxRecords, tx) {
    let aRemovedSupplierInvoiceWhldgTaxRecords_Ids = RemovedSupplierInvoiceWhldgTaxRecords.map(record => record.supplierInvoiceWhldgTax_Id);
    if (aRemovedSupplierInvoiceWhldgTaxRecords_Ids.length > 0) {
        var lineQuery = DELETE.from('SupplierInvoiceWhldgTax')
            .where({ ID: { in: aRemovedSupplierInvoiceWhldgTaxRecords_Ids } });
    
        await executeQuery(tx, lineQuery);
    }
}

// Delete line details for PO and GL Account records if any
async function deleteLineDetails(RemovedPoLineDetails, RemovedGlAccountLineDetails, tx) {
    let aPoLineDetails_Ids = RemovedPoLineDetails.map(detail => detail.lineDetail_ID);
    let aBodyPOIntegrationInfo_Ids = RemovedPoLineDetails.map(detail => detail.bodyPOIntegrationInfo_Id);
    let aGlAccountLineDetails_Ids = RemovedGlAccountLineDetails.map(detail => detail.lineDetail_ID);
    let aBodyGLAccountIntegrationInfo_Ids = RemovedGlAccountLineDetails.map(detail => detail.bodyGLAccountIntegrationInfo_Id);

    await deletePOLineDetails(aPoLineDetails_Ids, aBodyPOIntegrationInfo_Ids, tx);
    await deleteGLAccountLineDetails(aGlAccountLineDetails_Ids, aBodyGLAccountIntegrationInfo_Ids, tx);
}

async function deletePOLineDetails(aPoLineDetails_Ids, aBodyPOIntegrationInfo_Ids, tx) {
    if (aPoLineDetails_Ids.length > 0) {
        var lineQuery = DELETE.from('DettaglioLinee')
            .where({ ID: { in: aPoLineDetails_Ids } });
        var poQuery = DELETE.from('POIntegrationInfoBody')
            .where({ ID: { in: aBodyPOIntegrationInfo_Ids } });
    
        await executeQuery(tx, lineQuery);
        await executeQuery(tx, poQuery);
    }
}

async function updatePOLineDetails(poRecords, tx) {
    for (const oLineDetail of poRecords) {
        if (oLineDetail.lineDetail_ID) {
            const lineQuery = UPDATE('DettaglioLinee')
                .set({
                    "prezzoTotale": oLineDetail.SupplierInvoiceItemAmount,
                    "quantita": oLineDetail.PurchaseOrderQuantityUnit,
                    "prezzoUnitario": oLineDetail.PurchaseOrderPriceUnit,
                    "aliquotaIVA": oLineDetail.TaxCode,
                    "descrizione": oLineDetail.SupplierInvoiceItemText
                })
                .where(`ID = '${oLineDetail.lineDetail_ID}'`);

            const poQuery = UPDATE('POIntegrationInfoBody')
                .set({
                    "purchaseOrder": oLineDetail.PurchaseOrder,
                    "purchaseOrderItem": oLineDetail.PurchaseOrderItem,
                    "plant": oLineDetail.Plant,
                    "isSubsequentDebitCredit": oLineDetail.IsSubsequentDebitCredit,
                    "quantityInPurchaseOrderUnit": oLineDetail.QuantityInPurchaseOrderPriceUnit,
                    "qtyInPurchaseOrderPriceUnit": oLineDetail.QtyInPurchaseOrderPriceUnit,
                    "isNotCashDiscountLiable": oLineDetail.IsNotCashDiscountLiable,
                    "serviceEntrySheet": oLineDetail.ServiceEntrySheet,
                    "serviceEntrySheetItem": oLineDetail.ServiceEntrySheetItem,
                    "isFinallyInvoiced": oLineDetail.IsFinallyInvoiced,
                    "taxDeterminationDate": oLineDetail.TaxDeterminationDate,
                    "costCenter": oLineDetail.CostCenter,
                    "controllingArea": oLineDetail.ControllingArea,
                    "businessArea": oLineDetail.BusinessArea,
                    "profitCenter": oLineDetail.ProfitCenter,
                    "functionalArea": oLineDetail.FunctionalArea,
                    "wBSElement": oLineDetail.WBSElement,
                    "salesOrder": oLineDetail.SalesOrder,
                    "salesOrderItem": oLineDetail.SalesOrderItem,
                    "internalOrder": oLineDetail.InternalOrder,
                    "commitmentItem": oLineDetail.CommitmentItem,
                    "fundsCenter": oLineDetail.FundsCenter,
                    "fund": oLineDetail.Fund,
                    "grantID": oLineDetail.GrantID,
                    "profitabilitySegment": oLineDetail.profitabilitySegment
                })
                .where(`ID = '${oLineDetail.bodyPOIntegrationInfo_Id}'`);

            await executeQuery(tx, lineQuery);
            await executeQuery(tx, poQuery);
        }
    }
}

async function insertPOLineDetails(aNewPoLineDetails, header_Id_InvoiceIntegrationInfo, tx) {
    var aNewLineDetailRecords = [];
    var aNewPoIntegrationInfoBodyRecords = [];
    for (const oLineDetail of aNewPoLineDetails) {
        const lineDetail_ID = uuidv4();
        const bodyPOIntegrationInfo_ID = uuidv4();
        aNewLineDetailRecords.push({
            "ID": lineDetail_ID,
            "body_Id": oLineDetail.bodyInvoiceItalianTrace_Id,
            "bodyPOIntegrationInfo_ID": bodyPOIntegrationInfo_ID,
            "prezzoTotale": oLineDetail.SupplierInvoiceItemAmount,
            "quantita": oLineDetail.PurchaseOrderQuantityUnit,
            "prezzoUnitario": oLineDetail.PurchaseOrderPriceUnit,
            "aliquotaIVA": oLineDetail.TaxCode,
            "descrizione": oLineDetail.SupplierInvoiceItemText
        });

        aNewPoIntegrationInfoBodyRecords.push({
            "ID": bodyPOIntegrationInfo_ID,
            "header_Id": header_Id_InvoiceIntegrationInfo,
            "refDocumentCategory": oLineDetail.RefDocumentCategory,
            "to_SelectedPurchaseOrders_PurchaseOrder": oLineDetail.To_SelectedPurchaseOrders_PurchaseOrder,
            "to_SelectedPurchaseOrders_PurchaseOrderItem": oLineDetail.To_SelectedPurchaseOrders_PurchaseOrderItem,
            "to_SelectedDeliveryNotes_InboundDeliveryNote": oLineDetail.To_SelectedDeliveryNotes_InboundDeliveryNote,
            "to_SelectedServiceEntrySheets_ServiceEntrySheet": oLineDetail.To_SelectedServiceEntrySheets_ServiceEntrySheet,
            "to_SelectedServiceEntrySheets_ServiceEntrySheetItem": oLineDetail.To_SelectedServiceEntrySheets_ServiceEntrySheetItem,
            "purchaseOrder": oLineDetail.PurchaseOrder,
            "purchaseOrderItem": oLineDetail.PurchaseOrderItem,
            "plant": oLineDetail.Plant,
            "isSubsequentDebitCredit": oLineDetail.IsSubsequentDebitCredit,
            "quantityInPurchaseOrderUnit": oLineDetail.QuantityInPurchaseOrderPriceUnit,
            "qtyInPurchaseOrderPriceUnit": oLineDetail.QtyInPurchaseOrderPriceUnit,
            "isNotCashDiscountLiable": oLineDetail.IsNotCashDiscountLiable,
            "serviceEntrySheet": oLineDetail.ServiceEntrySheet,
            "serviceEntrySheetItem": oLineDetail.ServiceEntrySheetItem,
            "isFinallyInvoiced": oLineDetail.IsFinallyInvoiced,
            "taxDeterminationDate": oLineDetail.TaxDeterminationDate,
            "costCenter": oLineDetail.CostCenter,
            "controllingArea": oLineDetail.ControllingArea,
            "businessArea": oLineDetail.BusinessArea,
            "profitCenter": oLineDetail.ProfitCenter,
            "functionalArea": oLineDetail.FunctionalArea,
            "wBSElement": oLineDetail.WBSElement,
            "salesOrder": oLineDetail.SalesOrder,
            "salesOrderItem": oLineDetail.SalesOrderItem,
            "commitmentItem": oLineDetail.CommitmentItem,
            "internalOrder": oLineDetail.InternalOrder,
            "fundsCenter": oLineDetail.FundsCenter,
            "fund": oLineDetail.Fund,
            "grantID": oLineDetail.GrantID,
            "profitabilitySegment": oLineDetail.profitabilitySegment
        });
    }

    if (aNewLineDetailRecords.length > 0) {
        const lineQuery = INSERT.into('DettaglioLinee')
            .entries(aNewLineDetailRecords);

        const poQuery = INSERT.into('POIntegrationInfoBody')
            .entries(aNewPoIntegrationInfoBodyRecords);

        await executeQuery(tx, lineQuery);
        await executeQuery(tx, poQuery);
    }
}

async function deleteGLAccountLineDetails(aGlAccountLineDetails_Ids, aBodyGLAccountIntegrationInfo_Ids, tx) {
    if (aGlAccountLineDetails_Ids.length > 0) {
        const lineQuery = DELETE.from('DettaglioLinee')
            .where({ ID: { in: aGlAccountLineDetails_Ids } });
        const glAccountQuery = DELETE.from('GLAccountIntegrationInfoBody')
            .where({ ID: { in: aBodyGLAccountIntegrationInfo_Ids } });

        await executeQuery(tx, lineQuery);
        await executeQuery(tx, glAccountQuery);
    }
}

async function updateGLAccountLineDetails(glRecords, tx) {
    for (const oLineDetail of glRecords) {
        if (oLineDetail.lineDetail_ID) {
            const lineQuery = UPDATE('DettaglioLinee')
                .set({
                    "descrizione": oLineDetail.SupplierInvoiceItemText,
                    "unitaMisura": oLineDetail.QuantityUnit,
                    "quantita": oLineDetail.Quantity
                })
                .where(`ID = '${oLineDetail.lineDetail_ID}'`);

            const glQuery = UPDATE('GLAccountIntegrationInfoBody')
                .set({
                    "companyCode": oLineDetail.CompanyCode,
                    "glAccount": oLineDetail.GLAccount,
                    "debitCreditCode": oLineDetail.DebitCreditCode,
                    "supplierInvoiceItemAmount": oLineDetail.SupplierInvoiceItemAmount,
                    "taxCode": oLineDetail.TaxCode,
                    "assignmentReference": oLineDetail.AssignmentReference,
                    "costCenter": oLineDetail.CostCenter,
                    "businessArea": oLineDetail.BusinessArea,
                    "partnerBusinessArea": oLineDetail.PartnerBusinessArea,
                    "profitCenter": oLineDetail.ProfitCenter,
                    "functionalArea": oLineDetail.FunctionalArea,
                    "salesOrder": oLineDetail.SalesOrder,
                    "salesOrderItem": oLineDetail.SalesOrderItem,
                    "costCtrActivityType": oLineDetail.CostCtrActivityType,
                    "wBSElement": oLineDetail.WBSElement,
                    "personnelNumber": oLineDetail.PersonnelNumber,
                    "isNotCashDiscountLiable": oLineDetail.IsNotCashDiscountLiable,
                    "internalOrder": oLineDetail.InternalOrder,
                    "commitmentItem": oLineDetail.CommitmentItem,
                    "fund": oLineDetail.Fund,
                    "grantID": oLineDetail.GrantID,
                    "financialTransactionType": oLineDetail.FinancialTransactionType,
                    "earmarkedFundsDocument": oLineDetail.EarmarkedFundsDocument,
                    "earmarkedFundsDocumentItem": oLineDetail.EarmarkedFundsDocumentItem,
                    "budgetPeriod": oLineDetail.BudgetPeriod
                })
                .where(`ID = '${oLineDetail.bodyGLAccountIntegrationInfo_Id}'`);

            await executeQuery(tx, lineQuery);
            await executeQuery(tx, glQuery);
        }
    }
}

async function insertGLAccountLineDetails(aNewGlAccountLineDetails, header_Id_InvoiceIntegrationInfo, tx) {
    var aNewLineDetailRecords = [];
    var aNewGlAccountIntegrationInfoBodyRecords = [];
    for (const oLineDetail of aNewGlAccountLineDetails) {
        const lineDetail_ID = uuidv4();
        const bodyGLAccountIntegrationInfo_ID = uuidv4();
        aNewLineDetailRecords.push({
            "ID": lineDetail_ID,
            "body_Id": oLineDetail.bodyInvoiceItalianTrace_Id,
            "bodyGLAccountIntegrationInfo_ID": bodyGLAccountIntegrationInfo_ID,
            "descrizione": oLineDetail.SupplierInvoiceItemText,
            "unitaMisura": oLineDetail.QuantityUnit,
            "quantita": oLineDetail.Quantity
        });

        aNewGlAccountIntegrationInfoBodyRecords.push({
            "ID": bodyGLAccountIntegrationInfo_ID,
            "header_Id": header_Id_InvoiceIntegrationInfo,
            "companyCode": oLineDetail.CompanyCode,
            "glAccount": oLineDetail.GLAccount,
            "debitCreditCode": oLineDetail.DebitCreditCode,
            "supplierInvoiceItemAmount": oLineDetail.SupplierInvoiceItemAmount,
            "taxCode": oLineDetail.TaxCode,
            "assignmentReference": oLineDetail.AssignmentReference,
            "costCenter": oLineDetail.CostCenter,
            "businessArea": oLineDetail.BusinessArea,
            "partnerBusinessArea": oLineDetail.PartnerBusinessArea,
            "profitCenter": oLineDetail.ProfitCenter,
            "functionalArea": oLineDetail.FunctionalArea,
            "salesOrder": oLineDetail.SalesOrder,
            "salesOrderItem": oLineDetail.SalesOrderItem,
            "costCtrActivityType": oLineDetail.CostCtrActivityType,
            "wBSElement": oLineDetail.WBSElement,
            "personnelNumber": oLineDetail.PersonnelNumber,
            "isNotCashDiscountLiable": oLineDetail.IsNotCashDiscountLiable,
            "internalOrder": oLineDetail.InternalOrder,
            "commitmentItem": oLineDetail.CommitmentItem,
            "fund": oLineDetail.Fund,
            "grantID": oLineDetail.GrantID,
            "financialTransactionType": oLineDetail.FinancialTransactionType,
            "earmarkedFundsDocument": oLineDetail.EarmarkedFundsDocument,
            "earmarkedFundsDocumentItem": oLineDetail.EarmarkedFundsDocumentItem,
            "budgetPeriod": oLineDetail.BudgetPeriod
        });
    }

    if (aNewLineDetailRecords.length > 0) {
        const lineQuery = INSERT.into('DettaglioLinee')
        .entries(aNewLineDetailRecords);

        const glQuery = INSERT.into('GLAccountIntegrationInfoBody')
            .entries(aNewGlAccountIntegrationInfoBodyRecords);

        await executeQuery(tx, lineQuery);
        await executeQuery(tx, glQuery);
    }
}


// Update DOC_PACK table
async function updateDocPack(modifiedBy, modifiedAt, PackageId, tx) {
    // Defining update dock_pack query
    const updateDocPackQuery = UPDATE('DOC_PACK')
        .set(`modifiedBy = '${modifiedBy}', modifiedAt = '${modifiedAt}'`)
        .where(`PackageId = '${PackageId}'`);

    await executeQuery(tx, updateDocPackQuery);
}

// Execute query and handle errors
async function executeQuery(tx, query) {
    const data = await tx.run(query);
    if (!data) {
        throw new Error('Query execution failed');
    }
    return data;
}