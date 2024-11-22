// utils/payloadBuilder.js

const { results } = require('@sap/cds/lib/utils/cds-utils');
const { getDateWithMilliseconds, getDateWithMillisecondsWithoutParam } = require('./utilities');

function buildPayloadForSubmitInvoice(jsonInvoice) {
    let aTo_SupplierInvoiceWhldgTax = jsonInvoice.To_SupplierInvoiceWhldgTax.map(oTo_SupplierInvoiceWhldgTax => {
        return {
            WithholdingTaxType: oTo_SupplierInvoiceWhldgTax.WithholdingTaxType,
            DocumentCurrency: oTo_SupplierInvoiceWhldgTax.DocumentCurrency,
            WithholdingTaxCode: oTo_SupplierInvoiceWhldgTax.WithholdingTaxCode,
            WithholdingTaxBaseAmount: oTo_SupplierInvoiceWhldgTax.WithholdingTaxBaseAmount ? String(oTo_SupplierInvoiceWhldgTax.WithholdingTaxBaseAmount) : null,
            WhldgTaxBaseIsEnteredManually: oTo_SupplierInvoiceWhldgTax.WhldgTaxBaseIsEnteredManually
        }
    });
    let aTo_SelectedPurchaseOrders = [];
    let aTo_SelectedDeliveryNotes = [];
    let aTo_SelectedServiceEntrySheets = [];

    switch(jsonInvoice.RefDocumentCategory) {
        case 'keyRefDocCategory1':
            aTo_SelectedPurchaseOrders.push({PurchaseOrder: jsonInvoice.PurchaseOrder, PurchaseOrderItem: jsonInvoice.PurchaseOrderItem});
            break;
        case 'keyRefDocCategory2':
            aTo_SelectedDeliveryNotes.push({InboundDeliveryNote: jsonInvoice.InboundDeliveryNote});
            break;
        case 'keyRefDocCategoryS':
            aTo_SelectedServiceEntrySheets.push({ServiceEntrySheet: jsonInvoice.ServiceEntrySheet, ServiceEntrySheetItem: jsonInvoice.ServiceEntrySheetItem});
            break;
        default:
            aTo_SelectedPurchaseOrders = [];
            aTo_SelectedDeliveryNotes = [];
            aTo_SelectedServiceEntrySheets = [];
    }

    let aTo_SuplrInvcItemPurOrdRef = jsonInvoice.PORecords.map(oTo_SuplrInvcItemPurOrdRef => {
        return {
            SupplierInvoiceItem: oTo_SuplrInvcItemPurOrdRef.SupplierInvoiceItem,
            PurchaseOrder: oTo_SuplrInvcItemPurOrdRef.PurchaseOrder,
            PurchaseOrderItem: oTo_SuplrInvcItemPurOrdRef.PurchaseOrderItem,
            Plant: oTo_SuplrInvcItemPurOrdRef.Plant,
            IsSubsequentDebitCredit: oTo_SuplrInvcItemPurOrdRef.IsSubsequentDebitCredit,
            TaxCode: oTo_SuplrInvcItemPurOrdRef.TaxCode,
            DocumentCurrency: oTo_SuplrInvcItemPurOrdRef.DocumentCurrency,
            SupplierInvoiceItemAmount: oTo_SuplrInvcItemPurOrdRef.SupplierInvoiceItemAmount ? String(oTo_SuplrInvcItemPurOrdRef.SupplierInvoiceItemAmount) : null,
            PurchaseOrderQuantityUnit: oTo_SuplrInvcItemPurOrdRef.PurchaseOrderQuantityUnit,
            QuantityInPurchaseOrderUnit: oTo_SuplrInvcItemPurOrdRef.QuantityInPurchaseOrderUnit ? String(oTo_SuplrInvcItemPurOrdRef.QuantityInPurchaseOrderUnit) : null,
            PurchaseOrderPriceUnit: oTo_SuplrInvcItemPurOrdRef.PurchaseOrderPriceUnit,
            QtyInPurchaseOrderPriceUnit: oTo_SuplrInvcItemPurOrdRef.QtyInPurchaseOrderPriceUnit ? String(oTo_SuplrInvcItemPurOrdRef.QtyInPurchaseOrderPriceUnit) : null,
            SupplierInvoiceItemText: oTo_SuplrInvcItemPurOrdRef.SupplierInvoiceItemText,
            IsNotCashDiscountLiable: oTo_SuplrInvcItemPurOrdRef.IsNotCashDiscountLiable,
            ServiceEntrySheet: oTo_SuplrInvcItemPurOrdRef.ServiceEntrySheet,
            ServiceEntrySheetItem: oTo_SuplrInvcItemPurOrdRef.ServiceEntrySheetItem,
            IsFinallyInvoiced: oTo_SuplrInvcItemPurOrdRef.IsFinallyInvoiced,
            TaxDeterminationDate: oTo_SuplrInvcItemPurOrdRef.TaxDeterminationDate,
            to_SupplierInvoiceItmAcctAssgmt: { results : [
                {
                    CostCenter: oTo_SuplrInvcItemPurOrdRef.CostCenter,
                    ControllingArea: oTo_SuplrInvcItemPurOrdRef.ControllingArea,
                    BusinessArea: oTo_SuplrInvcItemPurOrdRef.BusinessArea,
                    ProfitCenter: oTo_SuplrInvcItemPurOrdRef.ProfitCenter,
                    FunctionalArea: oTo_SuplrInvcItemPurOrdRef.FunctionalArea,
                    WBSElement: oTo_SuplrInvcItemPurOrdRef.WBSElement,
                    SalesOrder: oTo_SuplrInvcItemPurOrdRef.SalesOrder,
                    SalesOrderItem: oTo_SuplrInvcItemPurOrdRef.SalesOrderItem,
                    InternalOrder: oTo_SuplrInvcItemPurOrdRef.InternalOrder,
                    CommitmentItem: oTo_SuplrInvcItemPurOrdRef.CommitmentItem,
                    FundsCenter: oTo_SuplrInvcItemPurOrdRef.FundsCenter,
                    Fund: oTo_SuplrInvcItemPurOrdRef.Fund,
                    GrantID: oTo_SuplrInvcItemPurOrdRef.GrantID,
                    ProfitabilitySegment: oTo_SuplrInvcItemPurOrdRef.ProfitabilitySegment,
                    BudgetPeriod: oTo_SuplrInvcItemPurOrdRef.BudgetPeriod
                }
            ]}
        }
    });
    let aTo_SupplierInvoiceItemGLAcct = jsonInvoice.GLAccountRecords.map(oTo_SupplierInvoiceItemGLAcct => {
        return {
            SupplierInvoiceItem: oTo_SupplierInvoiceItemGLAcct.SupplierInvoiceItem,
            CompanyCode: oTo_SupplierInvoiceItemGLAcct.CompanyCode,
            GLAccount: oTo_SupplierInvoiceItemGLAcct.GLAccount,
            DebitCreditCode: oTo_SupplierInvoiceItemGLAcct.DebitCreditCode,
            DocumentCurrency: oTo_SupplierInvoiceItemGLAcct.DocumentCurrency,
            SupplierInvoiceItemAmount: oTo_SupplierInvoiceItemGLAcct.SupplierInvoiceItemAmount,
            TaxCode: oTo_SupplierInvoiceItemGLAcct.CompanyTaxCodeCode,
            AssignmentReference: oTo_SupplierInvoiceItemGLAcct.AssignmentReference,
            SupplierInvoiceItemText: oTo_SupplierInvoiceItemGLAcct.SupplierInvoiceItemText,
            CostCenter: oTo_SupplierInvoiceItemGLAcct.CostCenter,
            BusinessArea: oTo_SupplierInvoiceItemGLAcct.BusinessArea,
            PartnerBusinessArea: oTo_SupplierInvoiceItemGLAcct.PartnerBusinessArea,
            ProfitCenter: oTo_SupplierInvoiceItemGLAcct.ProfitCenter,
            FunctionalArea: oTo_SupplierInvoiceItemGLAcct.FunctionalArea,
            SalesOrder: oTo_SupplierInvoiceItemGLAcct.SalesOrder,
            SalesOrderItem: oTo_SupplierInvoiceItemGLAcct.SalesOrderItem,
            CostCtrActivityType: oTo_SupplierInvoiceItemGLAcct.CostCtrActivityType,
            WBSElement: oTo_SupplierInvoiceItemGLAcct.WBSElement,
            PersonnelNumber: oTo_SupplierInvoiceItemGLAcct.PersonnelNumber,
            IsNotCashDiscountLiable: oTo_SupplierInvoiceItemGLAcct.IsNotCashDiscountLiable,
            InternalOrder: oTo_SupplierInvoiceItemGLAcct.InternalOrder,
            CommitmentItem: oTo_SupplierInvoiceItemGLAcct.CommitmentItem,
            Fund: oTo_SupplierInvoiceItemGLAcct.Fund,
            GrantID: oTo_SupplierInvoiceItemGLAcct.GrantID,
            QuantityUnit: oTo_SupplierInvoiceItemGLAcct.QuantityUnit,
            Quantity: oTo_SupplierInvoiceItemGLAcct.Quantity,
            FinancialTransactionType: oTo_SupplierInvoiceItemGLAcct.FinancialTransactionType,
            EarmarkedFundsDocument: oTo_SupplierInvoiceItemGLAcct.EarmarkedFundsDocument,
            EarmarkedFundsDocumentItem: oTo_SupplierInvoiceItemGLAcct.EarmarkedFundsDocumentItem,
            BudgetPeriod: oTo_SupplierInvoiceItemGLAcct.BudgetPeriod
        }
    });
    let oPayload = {
        CompanyCode: jsonInvoice.CompanyCode,
        DocumentDate: getDateWithMilliseconds(jsonInvoice.DocumentDate),
        InvoiceReceiptDate: getDateWithMilliseconds(jsonInvoice.InvoiceReceiptDate),
        PostingDate: getDateWithMilliseconds(jsonInvoice.PostingDate),
        InvoicingParty: jsonInvoice.InvoicingParty,
        DocumentCurrency: jsonInvoice.Currency,
        SupplierInvoiceIDByInvcgParty: jsonInvoice.SupplierInvoiceIDByInvcgParty,
        InvoiceGrossAmount: jsonInvoice.InvoiceGrossAmount ? String(jsonInvoice.InvoiceGrossAmount) : null,
        SupplierPostingLineItemText: jsonInvoice.SupplierPostingLineItemText,
        TaxIsCalculatedAutomatically: jsonInvoice.TaxIsCalculatedAutomatically,
        DueCalculationBaseDate: getDateWithMilliseconds(jsonInvoice.DueCalculationBaseDate),
        ManualCashDiscount: jsonInvoice.ManualCashDiscount ? String(jsonInvoice.ManualCashDiscount) : null,
        PaymentTerms: jsonInvoice.PaymentTerms,
        CashDiscount1Days: jsonInvoice.CashDiscount1Days ? String(jsonInvoice.CashDiscount1Days) : null,
        CashDiscount1Percent: jsonInvoice.CashDiscount1Percent ? String(jsonInvoice.CashDiscount1Percent) : null,
        CashDiscount2Days: jsonInvoice.CashDiscount2Days ? String(jsonInvoice.CashDiscount2Days) : null,
        CashDiscount2Percent: jsonInvoice.CashDiscount2Percent ? String(jsonInvoice.CashDiscount2Percent) : null,
        FixedCashDiscount: jsonInvoice.FixedCashDiscount,
        NetPaymentDays: jsonInvoice.NetPaymentDays ? String(jsonInvoice.NetPaymentDays) : null,
        BPBankAccountInternalID: jsonInvoice.BPBankAccountInternalID,
        PaymentMethod: jsonInvoice.PaymentMethod,
        InvoiceReference: jsonInvoice.InvoiceReference,
        InvoiceReferenceFiscalYear: jsonInvoice.InvoiceReferenceFiscalYear,
        HouseBank: jsonInvoice.HouseBank,
        HouseBankAccount: jsonInvoice.HouseBankAccount,
        PaymentBlockingReason: jsonInvoice.PaymentBlockingReason,
        PaymentReason: jsonInvoice.PaymentReason,
        UnplannedDeliveryCost: jsonInvoice.UnplannedDeliveryCost ? String(jsonInvoice.UnplannedDeliveryCost) : null,
        DocumentHeaderText: jsonInvoice.DocumentHeaderText,
        AccountingDocumentType: jsonInvoice.AccountingDocumentType,
        SupplyingCountry: jsonInvoice.SupplyingCountry,
        AssignmentReference: jsonInvoice.AssignmentReference,
        IsEUTriangularDeal: jsonInvoice.IsEUTriangularDeal,
        TaxDeterminationDate: getDateWithMilliseconds(jsonInvoice.TaxDeterminationDate),
        TaxReportingDate: getDateWithMilliseconds(jsonInvoice.TaxReportingDate),
        TaxFulfillmentDate: getDateWithMilliseconds(jsonInvoice.TaxFulfillmentDate),
        to_SupplierInvoiceWhldgTax: { results: aTo_SupplierInvoiceWhldgTax },
        to_SelectedPurchaseOrders: { results: aTo_SelectedPurchaseOrders },
        to_SelectedDeliveryNotes: { results: aTo_SelectedDeliveryNotes },
        to_SelectedServiceEntrySheets: { results: aTo_SelectedServiceEntrySheets },
        to_SuplrInvcItemPurOrdRef: {results: aTo_SuplrInvcItemPurOrdRef},
        to_SupplierInvoiceItemGLAcct: { results: aTo_SupplierInvoiceItemGLAcct }
    };
    return oPayload;
}

function buildPayloadForSubmitAttachment(AttachmentExtension, Attachment, AttachmentName, AttachmentType, LinkedSapObjectKey) {
    return {
        Headers: {
            'slug': AttachmentName,
            'BusinessObjectTypeName': 'BKPF',
            'LinkedSAPObjectKey': LinkedSapObjectKey
        },
        Body: {
            "DocumentInfoRecordDocType": AttachmentExtension,
            "Content": Attachment,
            "Content-Disposition": "form-data",
            "name": "myFileUpload[]",
            "filename": AttachmentName,
            "Content-Type": AttachmentType
        }
    }
}

module.exports = {
    buildPayloadForSubmitInvoice,
    buildPayloadForSubmitAttachment
}
