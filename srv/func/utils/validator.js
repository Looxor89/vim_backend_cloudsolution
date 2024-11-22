const Joi = require('@hapi/joi');

const schema = {
    doc_pack: Joi.array().min(1).items({
        PackageId: Joi.string().max(36).required(),
        Status: Joi.string().max(10),
        CreatedAt: Joi.date(),
        CreatedBy: Joi.string().email().allow(null),
        UpdatedAt: Joi.date(),
        UpdatedBy: Joi.string().email().allow(null),
        LockedAt: Joi.date().allow(null),
        LockedBy: Joi.string().email().allow(null),
        AssignedTo: Joi.string().email().allow(null),
        Flag: Joi.string().max(1).allow(null),
        InvoiceNumber: Joi.string().max(40).allow(null),
        CompanyCode: Joi.string().max(4).allow(null, ''),
        CompanyCodeDesc: Joi.string().max(40).allow(null, ''),
        PriorityCode: Joi.string().max(2).allow(null)
    }),
    doc_pack_update: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        Status: Joi.string().max(10),
        CreatedAt: Joi.date(),
        CreatedBy: Joi.string().email().allow(null),
        UpdatedAt: Joi.date(),
        UpdatedBy: Joi.string().email().allow(null),
        LockedAt: Joi.date().allow(null),
        LockedBy: Joi.string().email().allow(null),
        AssignedTo: Joi.string().email().allow(null),
        Flag: Joi.boolean().allow(null),
        InvoiceNumber: Joi.string().max(40).allow(null),
        CompanyCode: Joi.string().max(4).allow(null, ''),
        CompanyCodeDesc: Joi.string().max(40).allow(null, ''),
        PriorityCode: Joi.string().max(2).allow(null)
    }),
    doc_wf: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).max(36).required(),
        SeqNo: Joi.string().allow(null),
        Action: Joi.string().max(10),
        ActionBy: Joi.string().email(),
        ActionAt: Joi.date(),
        Note: Joi.string()
    }),
    doc_list: Joi.array().items({
        PackageId: Joi.string().max(36).required(),
        JobId: Joi.string().max(36).max(36).required(),
        ClientId: Joi.string().max(128).allow(''),
        FileName: Joi.string().required(),
        DocumentType: Joi.string().max(2).allow(''),
        IsMain: Joi.boolean(),
        DocCategory: Joi.string().max(10).allow(null, ''),
        CreatedAt: Joi.date(),
        CreatedBy: Joi.string().email().allow(null),
        Status: Joi.string().max(2).allow(''),
        Flag: Joi.string().max(1).allow(null),
        UpdatedAt: Joi.date(),
        UpdatedBy: Joi.string().email().allow(null),
        ObjectStoreRef: Joi.string().allow(null, ''),
        Confidence: Joi.number().allow(null),
        SupportingDoc: Joi.boolean()
    }),
    doc_list_update: Joi.object().min(1).keys({
        ClientId: Joi.string().max(128),
        FileName: Joi.string(),
        DocumentType: Joi.string().max(2),
        IsMain: Joi.boolean(),
        DocCategory: Joi.string().max(10).allow(null),
        CreatedAt: Joi.date(),
        CreatedBy: Joi.string().email().allow(null),
        Status: Joi.string().max(2),
        Flag: Joi.string().max(1).allow(null),
        UpdatedAt: Joi.date(),
        UpdatedBy: Joi.string().email().allow(null),
        ObjectStoreRef: Joi.string().allow(null, ''),
        Confidence: Joi.number().allow(null),
        SupportingDoc: Joi.boolean()
    }),
    doc_extract: Joi.object().keys({
        JobId: Joi.string().max(36).max(36).required(),
        SeqNo: Joi.string().allow(null),
        Metadata: Joi.object(),
        Flag: Joi.string().max(1).allow(null),
        CreatedOn: Joi.date(),
        UpdatedOn: Joi.date(),
        CreatedBy: Joi.string().email(),
        UpdatedBy: Joi.string().email()
    }),
    doc_notes: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).max(36).required(),
        SeqNo: Joi.string().allow(null),
        CreatedAt: Joi.date(),
        CreatedBy: Joi.string().email(),
        Subject: Joi.string(),
        Note: Joi.string()
    }),
    doc_cpi: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        CreatedBy: Joi.string().allow(null).required(),
        Docs: Joi.array().min(1).items({
            JobId: Joi.string().max(36).allow(null).required(),
            SupportingDoc: Joi.boolean().required(),
            ClientId: Joi.string().max(128).required(),
            FileName: Joi.string().required(),
            ObjectStoreRef: Joi.string().allow(null).required()
        })
    }),
    doc_cpi_update: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        JobId: Joi.string().max(36).required(),
        ObjectStoreRef: Joi.string().required()
    }),
    ap_users: Joi.array().min(1).items({
        UserId: Joi.string().max(255).required(),
        Email: Joi.string().email().required(),
        FirstName: Joi.string().max(50).allow('', null),
        LastName: Joi.string().max(50).allow('', null),
        Flag: Joi.string().max(1).allow(null),
        Department: Joi.string().max(10).allow(null),
        CustomParam1: Joi.string().max(10).allow(null),
        CustomParam2: Joi.string().max(10).allow(null),
    }),
    /**
     * Assign action validator
     */
    action_assign: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        AssignedTo: Joi.string().email().allow(null)
    }),
    /**
     * Forward action validator
     */
    action_forward: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        ForwardedTo: Joi.string().email().allow(null)
    }),
    /**
     * Unlock action validator
     */
    action_unlock: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        LockUser: Joi.string().email().allow(null)
    }),
    /**
     * Reject action validator
     */
    action_reject: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        sMode: Joi.string().max(6).allow(null)
    }),
    /**
     * Lock action validator
     */
    action_lock: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        LockUser: Joi.string().email().allow(null)
    }),
    /**
     * Save action validator
     */
    action_save_submit: Joi.object().min(1).keys({
        header_Id_ItalianInvoiceTrace: Joi.string().max(36).required(),
        header_Id_InvoiceIntegrationInfo: Joi.string().max(36).required(),
        Transaction: Joi.string().max(28).allow(null),
        CompanyCode: Joi.string().max(4).allow(null),
        DocumentDate: Joi.date().allow(null),
        InvoiceReceiptDate: Joi.date().allow(null),
        PostingDate: Joi.date().allow(null),
        InvoicingParty: Joi.string().max(10).allow(null),
        Currency: Joi.string().max(5).allow(null),
        SupplierInvoiceIDByInvcgParty: Joi.string().max(16).allow(null),
        InvoiceGrossAmount: Joi.number().precision(14).allow(null),
        SupplierPostingLineItemText: Joi.string().max(50).allow(null),
        TaxIsCalculatedAutomatically: Joi.boolean().allow(null),
        DueCalculationBaseDate: Joi.date().allow(null),
        ManualCashDiscount: Joi.number().precision(14).allow(null),
        PaymentTerms: Joi.string().max(4).allow(null),
        CashDiscount1Days: Joi.number().precision(3).allow(null),
        CashDiscount1Percent: Joi.number().precision(5).allow(null),
        CashDiscount2Days: Joi.number().precision(3).allow(null),
        CashDiscount2Percent: Joi.number().precision(5).allow(null),
        FixedCashDiscount: Joi.string().max(1).allow(null),
        NetPaymentDays: Joi.number().precision(3).allow(null),
        BPBankAccountInternalID: Joi.string().max(4).allow(null),
        PaymentMethod: Joi.string().max(1).allow(null),
        InvoiceReference: Joi.string().max(10).allow(null),
        InvoiceReferenceFiscalYear: Joi.string().max(4).allow(null),
        HouseBank: Joi.string().max(5).allow(null),
        HouseBankAccount: Joi.string().max(5).allow(null),
        PaymentBlockingReason: Joi.string().max(1).allow(null),
        PaymentReason: Joi.string().max(4).allow(null),
        UnplannedDeliveryCost: Joi.number().precision(14).allow(null),
        DocumentHeaderText: Joi.string().max(25).allow(null),
        AccountingDocumentType: Joi.string().max(2).allow(null),
        SupplyingCountry: Joi.string().max(3).allow(null),
        AssignmentReference: Joi.string().max(18).allow(null),
        IsEUTriangularDeal: Joi.boolean().allow(null),
        TaxDeterminationDate: Joi.date().allow(null),
        TaxReportingDate: Joi.date().allow(null),
        TaxFulfillmentDate: Joi.date().allow(null),
        To_SupplierInvoiceWhldgTax: Joi.array().items(
            Joi.object().keys({
                supplierInvoiceWhldgTax_Id: Joi.string().max(36).allow(null),
                header_Id_InvoiceIntegrationInfo: Joi.string().max(36).allow(null),
                WithholdingTaxType: Joi.string().max(2).allow(null),
                DocumentCurrency: Joi.string().max(5).allow(null),
                WithholdingTaxCode: Joi.string().max(2).allow(null),
                WithholdingTaxBaseAmount: Joi.number().precision(16).allow(null),
                WhldgTaxBaseIsEnteredManually: Joi.boolean().allow(null),
            })
        ),
        Allegati: Joi.array().items(Joi.object().keys({
            ID: Joi.string().max(36),
            body_Id: Joi.string().max(36),
            nomeAttachment: Joi.string().max(60).allow(null),
            algoritmoCompressione: Joi.string().max(10).allow(null),
            formatoAttachment: Joi.string().max(10).allow(null),
            descrizioneAttachment: Joi.string().max(100).allow(null),
            attachment: Joi.string()
        })),
        GLAccountRecords: Joi.array().items(
            Joi.object().keys({
                lineDetail_ID: Joi.string().max(36).allow(null),
                headerGLAccountIntegrationInfo_Id: Joi.string().max(36).allow(null),
                bodyInvoiceItalianTrace_Id: Joi.string().max(36).required(),
                bodyGLAccountIntegrationInfo_Id: Joi.string().max(36).allow(null),
                SupplierInvoiceItem: Joi.string().max(4).allow(null),
                CompanyCode: Joi.string().max(4).allow(null),
                GLAccount: Joi.string().max(10).allow(null),
                DebitCreditCode: Joi.string().max(1).allow(null),
                DocumentCurrency: Joi.string().max(5).allow(null),
                SupplierInvoiceItemAmount: Joi.number().precision(14).allow(null),
                TaxCode: Joi.string().max(2).allow(null),
                AssignmentReference: Joi.string().max(18).allow(null),
                SupplierInvoiceItemText: Joi.string().max(50).allow(null),
                CostCenter: Joi.string().max(10).allow(null),
                BusinessArea: Joi.string().max(4).allow(null),
                PartnerBusinessArea: Joi.string().max(4).allow(null),
                ProfitCenter: Joi.string().max(10).allow(null),
                FunctionalArea: Joi.string().max(16).allow(null),
                SalesOrder: Joi.string().max(10).allow(null),
                SalesOrderItem: Joi.string().max(6).allow(null),
                CostCtrActivityType: Joi.string().max(6).allow(null),
                WBSElement: Joi.string().max(24).allow(null),
                PersonnelNumber: Joi.string().max(8).allow(null),
                IsNotCashDiscountLiable: Joi.boolean().allow(null),
                InternalOrder: Joi.string().max(12).allow(null),
                CommitmentItem: Joi.string().max(24).allow(null),
                Fund: Joi.string().max(10).allow(null),
                GrantID: Joi.string().max(20).allow(null),
                QuantityUnit: Joi.string().max(3).allow(null),
                Quantity: Joi.number().precision(13).allow(null),
                FinancialTransactionType: Joi.string().max(3).allow(null),
                EarmarkedFundsDocument: Joi.string().max(10).allow(null),
                EarmarkedFundsDocumentItem: Joi.string().max(3).allow(null),
                BudgetPeriod: Joi.string().max(10).allow(null),
            })
        ),
        To_SelectedPurchaseOrders_PurchaseOrder: Joi.string().max(10).allow(null),
        To_SelectedPurchaseOrders_PurchaseOrderItem: Joi.string().max(5).allow(null),
        To_SelectedDeliveryNotes_InboundDeliveryNote: Joi.string().max(16).allow(null),
        To_SelectedServiceEntrySheets_ServiceEntrySheet: Joi.string().max(10).allow(null),
        To_SelectedServiceEntrySheets_ServiceEntrySheetItem: Joi.string().max(5).allow(null),
        RefDocumentCategory: Joi.string().max(28).allow(null),
        PORecords: Joi.array().items(
            Joi.object().keys({
                lineDetail_ID: Joi.string().max(36).allow(null),
                headerPOIntegrationInfo_Id: Joi.string().max(36).allow(null),
                bodyInvoiceItalianTrace_Id: Joi.string().max(36).required(),
                bodyPOIntegrationInfo_Id: Joi.string().max(36).allow(null),
                SupplierInvoiceItem: Joi.string().max(6).allow(null),
                PurchaseOrder: Joi.string().max(10).allow(null),
                PurchaseOrderItem: Joi.string().max(5).allow(null),
                Plant: Joi.string().max(4).allow(null),
                IsSubsequentDebitCredit: Joi.string().max(1).allow(null),
                TaxCode: Joi.string().max(2).allow(null),
                DocumentCurrency: Joi.string().max(5).allow(null),
                SupplierInvoiceItemAmount: Joi.number().precision(14).allow(null),
                PurchaseOrderQuantityUnit: Joi.string().max(3).allow(null),
                QuantityInPurchaseOrderUnit: Joi.number().precision(13).allow(null),
                QtyInPurchaseOrderPriceUnit: Joi.number().precision(13).allow(null),
                PurchaseOrderPriceUnit: Joi.string().max(3).allow(null),
                SupplierInvoiceItemText: Joi.string().max(50).allow(null),
                IsNotCashDiscountLiable: Joi.boolean().allow(null),
                ServiceEntrySheet: Joi.string().max(10).allow(null),
                ServiceEntrySheetItem: Joi.string().max(10).allow(null),
                IsFinallyInvoiced: Joi.boolean().allow(null),
                TaxDeterminationDate: Joi.date().allow(null),
                CostCenter: Joi.string().max(10).allow(null),
                ControllingArea: Joi.string().max(4).allow(null),
                BusinessArea: Joi.string().max(4).allow(null),
                ProfitCenter: Joi.string().max(10).allow(null),
                FunctionalArea: Joi.string().max(16).allow(null),
                WBSElement: Joi.string().max(24).allow(null),
                SalesOrder: Joi.string().max(10).allow(null),
                SalesOrderItem: Joi.string().max(6).allow(null),
                InternalOrder: Joi.string().max(12).allow(null),
                CommitmentItem: Joi.string().max(24).allow(null),
                FundsCenter: Joi.string().max(16).allow(null),
                Fund: Joi.string().max(10).allow(null),
                GrantID: Joi.string().max(20).allow(null),
                ProfitabilitySegment: Joi.string().max(10).allow(null),
                BudgetPeriod: Joi.string().max(10).allow(null),
            })
        )

    }),
    // action_save: Joi.object().min(1).keys({
    //     PackageId: Joi.string().max(36).required(),
    //     invoice: Joi.string()
    // }),
    /**
     * Comment action validator
     */
    action_comment: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        Subject: Joi.string(),
        Note: Joi.string()
    }),
    /**
     * Add document action validator
     */
    action_addDoc: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        JobId: Joi.string().max(36).max(36).required(),
        FileName: Joi.string().required(),
        ObjectStoreRef: Joi.string().allow(null, ''),
    }),
    /**
     * Add attachment action validator
     */
    action_addAttachment: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        BodyId: Joi.string().max(36).required(),
        AttachmentName: Joi.string().max(60).required(),
        AttachmentType: Joi.string().required(),
        AttachmentExtension: Joi.string().max(10).required(),
        CompanyCode: Joi.string().required(),
        ReferenceDocument: Joi.string().required(),
        FiscalYear: Joi.string().required(),
        Attachment: Joi.string().required(),
    }),
    /**
     * Remove job action validator
     */
    action_removeJob: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        JobId: Joi.string().max(36).max(36).required(),
        Mode: Joi.string(),
    }),

    /**
     * Set main job action validator
     */
    action_setMainJob: Joi.object().min(1).keys({
        PackageId: Joi.string().max(36).required(),
        JobId: Joi.string().max(36).max(36).required()
    }),

    /**
     * Massive submit validator
     */
    action_massiveSubmit: Joi.array().min(1).items({
        PackageId: Joi.string().max(36).required(),
        DocCategory: Joi.string().required()
    }),

}

module.exports = schema;