using vim from '../db/schema';
using V_DOC_EXTENDED from '../db/schema';
// using V_DOC_ATTACHMENTS from '../db/schema';

service CatalogService {
    entity AP_USERS                     as projection on vim.AP_USERS;
    entity DOC_PACK                     as projection on vim.DOC_PACK;
    // entity DOC_LIST                             as projection on vim.DOC_LIST;
    entity DOC_WF                       as projection on vim.DOC_WF;
    entity DOC_EXTRACT                  as projection on vim.DOC_EXTRACT;
    entity DOC_PACK_NOTES               as projection on vim.DOC_PACK_NOTES;
    entity DOC_EXTENDED                 as projection on V_DOC_EXTENDED;
    // entity DOC_ATTACHMENTS           as projection on V_DOC_ATTACHMENTS;
    // Integration data for invoice
    entity ERROR_LOG                    as projection on vim.ERROR_LOG;
    entity InvoiceIntegrationInfo       as projection on vim.InvoiceIntegrationInfo;
    entity SelectedPurchaseOrders       as projection on vim.SelectedPurchaseOrders;
    entity SelectedDeliveryNotes        as projection on vim.SelectedDeliveryNotes;
    entity SelectedServiceEntrySheets   as projection on vim.SelectedServiceEntrySheets;
    entity SupplierInvoiceWhldgTax      as projection on vim.SupplierInvoiceWhldgTax;
    entity POIntegrationInfoBody        as projection on vim.POIntegrationInfoBody;
    entity GLAccountIntegrationInfoBody as projection on vim.GLAccountIntegrationInfoBody;
    // Italian invoice definition entities
    entity FatturaElettronica           as projection on vim.FatturaElettronica;
    entity FatturaElettronicaBody       as projection on vim.FatturaElettronicaBody;
    entity DatiRitenuta                 as projection on vim.DatiRitenuta;
    entity DatiCassaPrevidenziale       as projection on vim.DatiCassaPrevidenziale;
    entity ScontoMaggiorazione          as projection on vim.ScontoMaggiorazione;
    entity DatiOrdineAcquisto           as projection on vim.DatiOrdineAcquisto;
    entity RiferimentoNumeroLinea       as projection on vim.RiferimentoNumeroLinea;
    entity RiferimentoNumeroLineaDDT    as projection on vim.RiferimentoNumeroLineaDDT;
    entity DettaglioLinee               as projection on vim.DettaglioLinee;
    entity CodiceArticolo               as projection on vim.CodiceArticolo;
    entity AltriDatiGestionali          as projection on vim.AltriDatiGestionali;
    entity DatiRiepilogo                as projection on vim.DatiRiepilogo;
    entity DatiPagamento                as projection on vim.DatiPagamento;
    entity DettaglioPagamento           as projection on vim.DettaglioPagamento;
    entity Allegati                     as projection on vim.Allegati;
    entity Causale                      as projection on vim.Causale;
    entity DatiDDT                      as projection on vim.DatiDDT;
    // functions and actions
    function extended()                                             returns array of String;
    function capabilities()                                         returns array of String;
    function users()                                                returns array of String;
    function lockStatus()                                           returns array of String;
    function notes()                                                returns array of String;
    function getInvoice()                                           returns array of String;
    function list()                                                 returns array of String;
    function currency()                                             returns array of String;
    function getMetadata()                                          returns array of String;
    function getAttachment()                                        returns array of String;
    function getPaymentTerms()                                      returns array of String;
    function getBusinessPartnerBank()                               returns array of String;
    function getPaymentMethods()                                    returns array of String;
    function getHouseBanks()                                        returns array of String;
    function getHouseBanksAccounts()                                returns array of String;
    function getAccountingDocumentType()                            returns array of String;
    function getWithholdingTax()                                    returns array of String;
    function getWithholdingTaxesType()                              returns array of String;
    function getWithholdingTaxesCode()                              returns array of String;
    action   assign(payload : assignPayload)                        returns array of String;
    action   forward(payload : forwardPayload)                      returns array of String;
    action   unlock(payload : unlockPayload)                        returns array of String;
    action   lock(payload : lockPayload)                            returns array of String;
    action   delete(payload : deletePayload)                        returns array of String;
    action   save(payload : savePayload)                            returns array of String;
    action   massiveSubmit(payload : array of massiveSubmitPayload) returns array of String;
    action   submit(payload : submitPayload)                        returns array of String;
    action   addNotes(payload : addNotesPayload)                    returns array of String;
    action   addDoc(payload : array of addDocPayload)               returns array of String;
    action   addAttachment(payload : addAttachmentPayload)          returns array of String;
    action   removeJob(payload : removeJobPayload)                  returns array of String;
    action   setMainJob(payload : setMainJobPayload)                returns array of String;

    type assignPayload {
        PackagesId : array of String;
        AssignedTo : String;
    };

    type forwardPayload {
        PackageId   : String;
        ForwardedTo : String;
    };

    type unlockPayload {
        PackageId : String;
    };

    type lockPayload {
        PackageId : String;
    };

    type deletePayload {
        PackagesId : array of String;
    };

    type savePayload {
        PackageId                                : String;
        Invoice                                  : InvoiceRecord;
        RemovedSelectedPurchaseOrdersRecords     : array of RemovedSelectedPurchaseOrdersRecords;
        RemovedSelectedDeliveryNotesRecords      : array of RemovedSelectedDeliveryNotesRecords;
        RemovedSelectedServiceEntrySheetsRecords : array of RemovedSelectedServiceEntrySheetsRecords;
        RemovedSupplierInvoiceWhldgTaxRecords    : array of RemovedSupplierInvoiceWhldgTaxRecords;
        RemovedPoLineDetails                     : array of RemovedPoLineDetails;
        RemovedGlAccountLineDetails              : array of RemovedGlAccountLineDetails;
    };

    type InvoiceRecord {
        header_Id_ItalianInvoiceTrace    : String;
        header_Id_InvoiceIntegrationInfo : String;
        Transaction                      : String;
        CompanyCode                      : String;
        DocumentDate                     : Date;
        InvoiceReceiptDate               : Date;
        PostingDate                      : Date;
        InvoicingParty                   : String;
        Currency                         : String;
        SupplierInvoiceIDByInvcgParty    : String;
        InvoiceGrossAmount               : Decimal;
        SupplierPostingLineItemText      : String;
        TaxIsCalculatedAutomatically     : Boolean;
        DueCalculationBaseDate           : Date;
        ManualCashDiscount               : Decimal;
        PaymentTerms                     : String;
        CashDiscount1Days                : Decimal;
        CashDiscount1Percent             : Decimal;
        CashDiscount2Days                : Decimal;
        CashDiscount2Percent             : Decimal;
        FixedCashDiscount                : String;
        NetPaymentDays                   : Decimal;
        BPBankAccountInternalID          : String;
        PaymentMethod                    : String;
        InvoiceReference                 : String;
        InvoiceReferenceFiscalYear       : String;
        HouseBank                        : String;
        HouseBankAccount                 : String;
        PaymentBlockingReason            : String;
        PaymentReason                    : String;
        UnplannedDeliveryCost            : Decimal;
        DocumentHeaderText               : String;
        AccountingDocumentType           : String;
        SupplyingCountry                 : String;
        AssignmentReference              : String;
        IsEUTriangularDeal               : Boolean;
        TaxDeterminationDate             : Date;
        TaxReportingDate                 : Date;
        TaxFulfillmentDate               : Date;
        RefDocumentCategory              : String;
        Allegati                         : array of Attachment;
        GLAccountRecords                 : array of GLAccountRecord;
        PORecords                        : array of PORecord;
        To_SelectedDeliveryNotes         : array of SelectedDeliveryNote;
        To_SelectedPurchaseOrders        : array of SelectedPurchaseOrder;
        To_SelectedServiceEntrySheets    : array of SelectedServiceEntrySheet;
        To_SupplierInvoiceWhldgTax       : array of SuppInvoiceWhldgTax;
    };

    type PORecord {
        lineDetail_ID               : String;
        headerPOIntegrationInfo_Id  : String;
        bodyInvoiceItalianTrace_Id  : String;
        bodyPOIntegrationInfo_Id    : String;
        SupplierInvoiceItem         : String;
        PurchaseOrder               : String;
        PurchaseOrderItem           : String;
        Plant                       : String;
        IsSubsequentDebitCredit     : String;
        TaxCode                     : String;
        DocumentCurrency            : String;
        SupplierInvoiceItemAmount   : Decimal;
        PurchaseOrderQuantityUnit   : String;
        QuantityInPurchaseOrderUnit : Decimal;
        QtyInPurchaseOrderPriceUnit : Decimal;
        PurchaseOrderPriceUnit      : String;
        SupplierInvoiceItemText     : String;
        IsNotCashDiscountLiable     : Boolean;
        ServiceEntrySheet           : String;
        ServiceEntrySheetItem       : String;
        IsFinallyInvoiced           : Boolean;
        TaxDeterminationDate        : Date;
        CostCenter                  : String;
        ControllingArea             : String;
        BusinessArea                : String;
        ProfitCenter                : String;
        FunctionalArea              : String;
        WBSElement                  : String;
        SalesOrder                  : String;
        SalesOrderItem              : String;
        InternalOrder               : String;
        CommitmentItem              : String;
        FundsCenter                 : String;
        Fund                        : String;
        GrantID                     : String;
        ProfitabilitySegment        : String;
        BudgetPeriod                : String;
    };

    type GLAccountRecord {
        lineDetail_ID                     : String;
        headerGLAccountIntegrationInfo_Id : String;
        bodyInvoiceItalianTrace_Id        : String;
        bodyGLAccountIntegrationInfo_Id   : String;
        SupplierInvoiceItem               : String;
        CompanyCode                       : String;
        GLAccount                         : String;
        DebitCreditCode                   : String;
        DocumentCurrency                  : String;
        SupplierInvoiceItemAmount         : Decimal;
        TaxCode                           : String;
        AssignmentReference               : String;
        SupplierInvoiceItemText           : String;
        CostCenter                        : String;
        BusinessArea                      : String;
        PartnerBusinessArea               : String;
        ProfitCenter                      : String;
        FunctionalArea                    : String;
        SalesOrder                        : String;
        SalesOrderItem                    : String;
        CostCtrActivityType               : String;
        WBSElement                        : String;
        PersonnelNumber                   : String;
        IsNotCashDiscountLiable           : Boolean;
        InternalOrder                     : String;
        CommitmentItem                    : String;
        Fund                              : String;
        GrantID                           : String;
        QuantityUnit                      : String;
        Quantity                          : Decimal;
        FinancialTransactionType          : String;
        EarmarkedFundsDocument            : String;
        EarmarkedFundsDocumentItem        : String;
        BudgetPeriod                      : String;
    }

    type Attachment {
        ID                    : String;
        body_Id               : String;
        nomeAttachment        : String;
        algoritmoCompressione : String;
        formatoAttachment     : String;
        descrizioneAttachment : String;
        attachment            : LargeString;
    };

    type SelectedPurchaseOrder {
        selectedPurchaseOrders_Id        : String;
        header_Id_InvoiceIntegrationInfo : String;
        PurchaseOrder                    : String;
        PurchaseOrderItem                : String;
    };

    type SelectedDeliveryNote {
        selectedDeliveryNotes_Id         : String;
        header_Id_InvoiceIntegrationInfo : String;
        InboundDeliveryNote              : String;
    };

    type SelectedServiceEntrySheet {
        selectedServiceEntrySheets_Id    : String;
        header_Id_InvoiceIntegrationInfo : String;
        serviceEntrySheet                : String;
        serviceEntrySheetItem            : String;
    };

    type SuppInvoiceWhldgTax {
        supplierInvoiceWhldgTax_Id       : String;
        header_Id_InvoiceIntegrationInfo : String;
        WithholdingTaxType               : String;
        DocumentCurrency                 : String;
        WithholdingTaxCode               : String;
        WithholdingTaxBaseAmount         : Decimal;
        WhldgTaxBaseIsEnteredManually    : Boolean;
    };

    type RemovedSelectedPurchaseOrdersRecords {
        selectedPurchaseOrders_Id : String;
    };

    type RemovedSelectedDeliveryNotesRecords {
        selectedDeliveryNotes_Id : String;
    };

    type RemovedSelectedServiceEntrySheetsRecords {
        selectedServiceEntrySheets_Id : String;
    };

    type RemovedSupplierInvoiceWhldgTaxRecords {
        supplierInvoiceWhldgTax_Id : String;
    };

    type RemovedPoLineDetails {
        lineDetail_ID            : String;
        bodyPOIntegrationInfo_Id : String;
    };

    type RemovedGlAccountLineDetails {
        lineDetail_ID                   : String;
        bodyGLAccountIntegrationInfo_Id : String;
    };

    type submitPayload {
        PackageId                                : String;
        Invoice                                  : InvoiceRecord;
        RemovedSelectedPurchaseOrdersRecords     : array of RemovedSelectedPurchaseOrdersRecords;
        RemovedSelectedDeliveryNotesRecords      : array of RemovedSelectedDeliveryNotesRecords;
        RemovedSelectedServiceEntrySheetsRecords : array of RemovedSelectedServiceEntrySheetsRecords;
        RemovedSupplierInvoiceWhldgTaxRecords    : array of RemovedSupplierInvoiceWhldgTaxRecords;
        RemovedPoLineDetails                     : array of RemovedPoLineDetails;
        RemovedGlAccountLineDetails              : array of RemovedGlAccountLineDetails;
    };

    type massiveSubmitPayload {
        PackageId   : String;
        DocCategory : String;
    };

    type addNotesPayload {
        PackageId : String;
        Subject   : String;
        Note      : String;
    };

    type addDocPayload {
        PackageId      : String;
        JobId          : String;
        FileName       : String;
        ObjectStoreRef : String;
    };

    type addAttachmentPayload {
        PackageId           : String;
        CompanyCode         : String;
        ReferenceDocument   : String;
        FiscalYear          : String;
        BodyId              : String;
        AttachmentName      : String;
        AttachmentType      : String;
        AttachmentExtension : String;
        Attachment          : LargeString;
    };

    type removeJobPayload {
        PackageId : String;
        JobId     : String;
        Mode      : String;
    };

    type setMainJobPayload {
        PackageId : String;
        JobId     : String;
    };
}
