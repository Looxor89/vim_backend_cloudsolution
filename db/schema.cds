using {managed} from '@sap/cds/common';

context vim {
  /**
   * Table which contains all relevant info about users
   */
  entity AP_USERS : managed {
    key Email        : String(255);
        FirstName    : String(50);
        LastName     : String(50);
        Flag         : Boolean;
        Departement  : String(10);
        CustomParam1 : String(10);
        CustomParam2 : String(10);
  }

  /**
   * Table which contains all info about invoice's elaboration task
   */
  // entity DOC_PACK : managed {
  //   key PackageId       : UUID;
  //       Status          : String(10);
  //       LockedAt        : DateTime;
  //       LockedBy        : String(255);
  //       AssignedTo      : String(255);
  //       Flag            : Boolean;
  //       InvoiceNumber   : String(40);
  //       CompanyCode     : String(4);
  //       CompanyCodeDesc : String(40);
  //       PriorityCode    : String(2);
  // }
  entity DOC_PACK : managed {
    key PackageId              : UUID;
        Status                 : String(10);
        ReferenceDocument      : String(10);
        FiscalYear             : String(4);
        LockedAt               : DateTime;
        LockedBy               : String(255);
        AssignedTo             : String(255);
        errorLog               : Association to many ERROR_LOG
                                   on errorLog.PackageId = $self.PackageId;
        InvoiceItalianTrace    : Association to one FatturaElettronica
                                   on InvoiceItalianTrace.navigation_to = $self;
        InvoiceIntegrationInfo : Association to one InvoiceIntegrationInfo
                                   on InvoiceIntegrationInfo.navigation_to = $self;
  }

  entity ERROR_LOG : managed {
    key ID               : UUID;
        PackageId        : UUID;
        ErrorMessage     : String;
        SubmittedInvoice : LargeString;
  }

  /**
   * Table which contains all info about processed invoices
   */
  // entity DOC_LIST : managed {
  //   key PackageId      : UUID;
  //   key JobId          : String(36);
  //       ClientId       : String(128);
  //       FileName       : LargeString;
  //       FileType       : String(5);
  //       DocumentType   : String(2);
  //       IsMain         : Boolean;
  //       DocCategory    : String(10);
  //       Status         : String(2);
  //       Flag           : Boolean;
  //       ObjectStoreRef : LargeString;
  //       Confidence     : Double;
  //       SupportingDoc  : Boolean;
  // }

  /**
   * Table which contains history of actions performed for an elaboration task
   */
  entity DOC_WF : managed {
    key PackageId : UUID;
    key SeqNo     : Integer64;
        Action    : String(10);
        ActionBy  : String(255);
        ActionAt  : DateTime;
        Note      : LargeString;
  }

  /**
   * Table which contains data extracted from document
   */
  entity DOC_EXTRACT : managed {
    key JobId    : String(36);
    key SeqNo    : Integer64;
        Metadata : LargeString;
        Flag     : Boolean;
  }

  /**
   * Table which contains notes about invoice
   */
  entity DOC_PACK_NOTES : managed {
    key PackageId : UUID;
    key SeqNo     : Integer64;
        Subject   : String;
        Note      : LargeString;
  }

  entity InvoiceIntegrationInfo {
    key ID                                              : UUID;
        navigation_to                                   : Association to one DOC_PACK;
        transaction                                     : String(28);
        companyCode                                     : String(4);
        supplierPostingLineItemText                     : String(50);
        taxIsCalculatedAutomatically                    : Boolean;
        invoiceReceiptDate                              : Date;
        postingDate                                     : Date;
        invoicingParty                                  : String(10);
        dueCalculationBaseDate                          : Date;
        manualCashDiscount                              : Decimal(14, 3);
        paymentTerms                                    : String(4);
        cashDiscount1Days                               : Integer;
        cashDiscount1Percent                            : Decimal(5, 3);
        cashDiscount2Days                               : Integer;
        cashDiscount2Percent                            : Decimal(4, 3);
        fixedCashDiscount                               : String(1);
        netPaymentDays                                  : Integer;
        bPBankAccountInternalID                         : String(4);
        invoiceReference                                : String(10);
        invoiceReferenceFiscalYear                      : String(4);
        houseBank                                       : String(5);
        houseBankAccount                                : String(5);
        paymentBlockingReason                           : String(1);
        paymentReason                                   : String(4);
        paymentMethod                                   : String(1);
        accountingDocumentType                          : String(2);
        unplannedDeliveryCost                           : Decimal(14, 3);
        documentHeaderText                              : String(25);
        // supplyingCountry              : String;
        assignmentReference                             : String(18);
        isEUTriangularDeal                              : Boolean;
        taxDeterminationDate                            : Date;
        taxReportingDate                                : Date;
        taxFulfillmentDate                              : Date;
        to_SupplierInvoiceWhldgTax                      : Association to many SupplierInvoiceWhldgTax
                                                            on to_SupplierInvoiceWhldgTax.header_Id = $self.ID;
        refDocumentCategory                             : String(28);
        to_SelectedPurchaseOrders_PurchaseOrder         : Association to many SelectedPurchaseOrders
                                                            on to_SelectedPurchaseOrders_PurchaseOrder.header_Id = $self.ID;
        to_SelectedDeliveryNotes_InboundDeliveryNote    : Association to many SelectedDeliveryNotes
                                                            on to_SelectedDeliveryNotes_InboundDeliveryNote.header_Id = $self.ID;
        to_SelectedServiceEntrySheets_ServiceEntrySheet : Association to many SelectedServiceEntrySheets
                                                            on to_SelectedServiceEntrySheets_ServiceEntrySheet.header_Id = $self.ID;
        bodyPOIntegrationInfo                           : Association to many POIntegrationInfoBody
                                                            on bodyPOIntegrationInfo.header_Id = $self.ID;
        bodyGLAccountIntegrationInfo                    : Association to many GLAccountIntegrationInfoBody
                                                            on bodyGLAccountIntegrationInfo.header_Id = $self.ID;
  }

  entity SelectedPurchaseOrders {
    key ID                : UUID;
        header_Id         : UUID;
        purchaseOrder     : String(10);
        purchaseOrderItem : String(5);
  }

  entity SelectedDeliveryNotes {
    key ID                  : UUID;
        header_Id           : UUID;
        inboundDeliveryNote : String(16);
  }

  entity SelectedServiceEntrySheets {
    key ID                    : UUID;
        header_Id             : UUID;
        serviceEntrySheet     : String(10);
        serviceEntrySheetItem : String(5);
  }

  entity SupplierInvoiceWhldgTax {
    key ID                            : UUID;
        header_Id                     : UUID;
        withholdingTaxType            : String(2);
        // documentCurrency              : String;
        withholdingTaxCode            : String(2);
        withholdingTaxBaseAmount      : Decimal(16, 3);
        whldgTaxBaseIsEnteredManually : Boolean;
  }

  entity POIntegrationInfoBody {
    key ID                          : UUID;
        header_Id                   : UUID;
        // supplierInvoiceItem         : String;
        purchaseOrder               : String(10);
        purchaseOrderItem           : String(5);
        plant                       : String(4);
        isSubsequentDebitCredit     : String(1);
        // documentCurrency            : String;
        // purchaseOrderPriceUnit      : String;
        purchaseOrderQuantityUnit   : String(3);
        qtyInPurchaseOrderPriceUnit : Decimal(13, 3);
        isNotCashDiscountLiable     : Boolean;
        serviceEntrySheet           : String(10);
        serviceEntrySheetItem       : String(10);
        isFinallyInvoiced           : Boolean;
        taxDeterminationDate        : Date;
        costCenter                  : String(10);
        controllingArea             : String(4);
        businessArea                : String(4);
        profitCenter                : String(10);
        functionalArea              : String(16);
        taxCode                     : String(2);
        supplierInvoiceItemText     : String(50);
        wBSElement                  : String(24);
        salesOrder                  : String(10);
        salesOrderItem              : String(6);
        internalOrder               : String(12);
        commitmentItem              : String(24);
        fundsCenter                 : String(16);
        fund                        : String(10);
        grantID                     : String(20);
        profitabilitySegment        : String(10);
        budgetPeriod                : String(10);
        dettaglioLinee              : Association to one DettaglioLinee
                                        on dettaglioLinee.bodyPOIntegrationInfo = $self;
  }

  entity GLAccountIntegrationInfoBody {
    key ID                         : UUID;
        header_Id                  : UUID;
        // supplierInvoiceItem        : String;
        companyCode                : String(4);
        glAccount                  : String(10);
        debitCreditCode            : String(1);
        // documentCurrency           : String;
        supplierInvoiceItemAmount  : Decimal(14, 3);
        taxCode                    : String(2);
        assignmentReference        : String(18);
        costCenter                 : String(10);
        businessArea               : String(4);
        partnerBusinessArea        : String(4);
        profitCenter               : String(10);
        functionalArea             : String(16);
        supplierInvoiceItemText    : String(50);
        salesOrder                 : String(10);
        salesOrderItem             : String(6);
        costCtrActivityType        : String(6);
        wBSElement                 : String(24);
        personnelNumber            : String(8);
        isNotCashDiscountLiable    : Boolean;
        internalOrder              : String(12);
        commitmentItem             : String(24);
        fund                       : String(10);
        grantID                    : String(20);
        // quantityUnit               : String;
        // quantity                   : String;
        financialTransactionType   : String(3);
        earmarkedFundsDocument     : String(10);
        earmarkedFundsDocumentItem : String(3);
        budgetPeriod               : String(10);
        dettaglioLinee             : Association to one DettaglioLinee
                                       on dettaglioLinee.bodyGLAccountIntegrationInfo = $self;
  }

  // Fattura con Header piatto
  entity FatturaElettronica {
    key ID                                                                           : UUID;
        datiTrasmissione_IdPaese                                                     : String(2);
        datiTrasmissione_IdCodice                                                    : String(28);
        datiTrasmissione_ProgressivoInvio                                            : String(10);
        datiTrasmissione_FormatoTrasmissione                                         : String(5);
        datiTrasmissione_CodiceDestinatario                                          : String(7);
        datiTrasmissione_ContattiTrasmittente_Telefono                               : String(12);
        datiTrasmissione_ContattiTrasmittente_Email                                  : String(256);
        datiTrasmissione_PECDestinatario                                             : String(256);
        cedentePrestatore_DatiAnagrafici_IdFiscaleIVA_IdPaese                        : String(2);
        cedentePrestatore_DatiAnagrafici_IdFiscaleIVA_IdCodice                       : String(28);
        cedentePrestatore_DatiAnagrafici_CodiceFiscale                               : String(16);
        cedentePrestatore_DatiAnagrafici_Anagrafica_Denominazione                    : String(80);
        cedentePrestatore_DatiAnagrafici_Anagrafica_Nome                             : String(60);
        cedentePrestatore_DatiAnagrafici_Anagrafica_Cognome                          : String(60);
        cedentePrestatore_DatiAnagrafici_Anagrafica_Titolo                           : String(10);
        cedentePrestatore_DatiAnagrafici_Anagrafica_CodEORI                          : String(17);
        cedentePrestatore_DatiAnagrafici_AlboProfessionale                           : String(60);
        cedentePrestatore_DatiAnagrafici_ProvinciaAlbo                               : String(2);
        cedentePrestatore_DatiAnagrafici_NumeroIscrizioneAlbo                        : String(60);
        cedentePrestatore_DatiAnagrafici_DataIscrizioneAlbo                          : Date;
        cedentePrestatore_DatiAnagrafici_RegimeFiscale                               : String(4);
        cedentePrestatore_Sede_Indirizzo                                             : String(60);
        cedentePrestatore_Sede_NumeroCivico                                          : String(8);
        cedentePrestatore_Sede_CAP                                                   : String(5);
        cedentePrestatore_Sede_Comune                                                : String(60);
        cedentePrestatore_Sede_Provincia                                             : String(2);
        cedentePrestatore_Sede_Nazione                                               : String(2);
        cedentePrestatore_StabileOrganizzazione_Indirizzo                            : String(60);
        cedentePrestatore_StabileOrganizzazione_CAP                                  : String(5);
        cedentePrestatore_StabileOrganizzazione_Comune                               : String(60);
        cedentePrestatore_StabileOrganizzazione_Provincia                            : String(2);
        cedentePrestatore_StabileOrganizzazione_Nazione                              : String(2);
        cedentePrestatore_IscrizioneREA_Ufficio                                      : String(2);
        cedentePrestatore_IscrizioneREA_NumeroREA                                    : String(20);
        cedentePrestatore_IscrizioneREA_CapitaleSociale                              : String(15);
        cedentePrestatore_IscrizioneREA_SocioUnico                                   : String(2);
        cedentePrestatore_IscrizioneREA_StatoLiquidazione                            : String(2);
        cedentePrestatore_Contatti_Telefono                                          : String(12);
        cedentePrestatore_Contatti_Fax                                               : String(12);
        cedentePrestatore_Contatti_Email                                             : String(256);
        cedentePrestatore_RiferimentoAmministrazione                                 : String(20);
        rappresentanteFiscale_DatiAnagrafici_IdFiscaleIVA_IdPaese                    : String(2);
        rappresentanteFiscale_DatiAnagrafici_IdFiscaleIVA_IdCodice                   : String(28);
        rappresentanteFiscale_DatiAnagrafici_CodiceFiscale                           : String(16);
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Denominazione                : String(80);
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Nome                         : String(60);
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Cognome                      : String(60);
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Titolo                       : String(10);
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_CodEORI                      : String(17);
        cessionarioCommittente_DatiAnagrafici_IdFiscaleIVA_IdPaese                   : String(2);
        cessionarioCommittente_DatiAnagrafici_IdFiscaleIVA_IdCodice                  : String(28);
        cessionarioCommittente_DatiAnagrafici_CodiceFiscale                          : String(16);
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Denominazione               : String(80);
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Nome                        : String(60);
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Cognome                     : String(60);
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Titolo                      : String(10);
        cessionarioCommittente_DatiAnagrafici_Anagrafica_CodEORI                     : String(17);
        cessionarioCommittente_Sede_Indirizzo                                        : String(60);
        cessionarioCommittente_Sede_NumeroCivico                                     : String(8);
        cessionarioCommittente_Sede_CAP                                              : String(5);
        cessionarioCommittente_Sede_Comune                                           : String(60);
        cessionarioCommittente_Sede_Provincia                                        : String(2);
        cessionarioCommittente_Sede_Nazione                                          : String(2);
        cessionarioCommittente_StabileOrganizzazione_Indirizzo                       : String(60);
        cessionarioCommittente_StabileOrganizzazione_CAP                             : String(5);
        cessionarioCommittente_StabileOrganizzazione_Comune                          : String(60);
        cessionarioCommittente_StabileOrganizzazione_Provincia                       : String(2);
        cessionarioCommittente_StabileOrganizzazione_Nazione                         : String(2);
        rappresentanteFiscale_RappresentanteFiscale_IdFiscaleIVA_IdPaese             : String(2);
        rappresentanteFiscale_RappresentanteFiscale_IdFiscaleIVA_IdCodice            : String(28);
        rappresentanteFiscale_RappresentanteFiscale_Denominazione                    : String(80);
        rappresentanteFiscale_RappresentanteFiscale_Nome                             : String(60);
        rappresentanteFiscale_RappresentanteFiscale_Cognome                          : String(60);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_IdFiscaleIVA_IdPaese     : String(2);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_IdFiscaleIVA_IdCodice    : String(28);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_CodiceFiscale            : String(16);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Denominazione : String(80);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Nome          : String(60);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Cognome       : String(60);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Titolo        : String(10);
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_CodEORI       : String(17);
        soggettoEmittente                                                            : String(2);
        navigation_to                                                                : Association to one DOC_PACK;
        body                                                                         : Association to many FatturaElettronicaBody
                                                                                         on body.header_Id = $self.ID;
  }

  // Body della Fattura
  entity FatturaElettronicaBody {
    key ID                                                         : UUID;
        header_Id                                                  : UUID;
        datiGenerali_DatiGeneraliDocumento_TipoDocumento           : String(4);
        datiGenerali_DatiGeneraliDocumento_Divisa                  : String(3);
        datiGenerali_DatiGeneraliDocumento_Data                    : Date;
        datiGenerali_DatiGeneraliDocumento_Numero                  : String(20);
        datiGenerali_DatiGeneraliDocumento_DatiBollo_BolloVirtuale : String(2);
        datiGenerali_DatiGeneraliDocumento_DatiBollo_ImportoBollo  : Decimal(15, 2);
        datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento  : Decimal(15, 2);
        datiGenerali_DatiGeneraliDocumento_Arrotondamento          : Decimal(15, 2);
        datiGenerali_DatiGeneraliDocumento_Art73                   : String(2);
        datiVeicolo_Data                                           : Date;
        datiVeicolo_TotalePercorso                                 : String(15);
        datiGenerali_DatiGeneraliDocumento_DatiRitenuta            : Association to many DatiRitenuta
                                                                       on datiGenerali_DatiGeneraliDocumento_DatiRitenuta.body_Id = $self.ID;
        datiGenerali_DatiGeneraliDocumento_DatiCassaPrevidenziale  : Association to many DatiCassaPrevidenziale
                                                                       on datiGenerali_DatiGeneraliDocumento_DatiCassaPrevidenziale.body_Id = $self.ID;
        datiGenerali_DatiGeneraliDocumento_ScontoMaggiorazione     : Association to many ScontoMaggiorazione
                                                                       on datiGenerali_DatiGeneraliDocumento_ScontoMaggiorazione.body_Id = $self.ID;
        datiGenerali_DatiGeneraliDocumento_Causale                 : Association to many Causale
                                                                       on datiGenerali_DatiGeneraliDocumento_Causale.body_Id = $self.ID;
        datiGenerali_DatiOrdineAcquisto                            : Association to many DatiOrdineAcquisto
                                                                       on datiGenerali_DatiOrdineAcquisto.body_Id = $self.ID;
        datiBeniServizi_DettaglioLinee                             : Association to many DettaglioLinee
                                                                       on datiBeniServizi_DettaglioLinee.body_Id = $self.ID;
        datiBeniServizi_DatiRiepilogo                              : Association to many DatiRiepilogo
                                                                       on datiBeniServizi_DatiRiepilogo.body_Id = $self.ID;
        datiPagamento                                              : Association to many DatiPagamento
                                                                       on datiPagamento.body_Id = $self.ID;
        allegati                                                   : Association to many Allegati
                                                                       on allegati.body_Id = $self.ID;
        datiGenerali_DatiDDT                                       : Association to many DatiDDT
                                                                       on datiGenerali_DatiDDT.body_Id = $self.ID;
  }

  entity DatiRitenuta {
    key ID               : UUID;
        body_Id          : UUID;
        tipoRitenuta     : String(4);
        importoRitenuta  : Decimal(15, 2);
        aliquotaRitenuta : Decimal(6, 2);
        causalePagamento : String(2);
  }

  entity DatiCassaPrevidenziale {
    key ID                         : UUID;
        body_Id                    : UUID;
        tipoCassa                  : String(4);
        aICassa                    : Decimal(6, 2);
        importoContributoCassa     : Decimal(15, 2);
        imponibileCassa            : Decimal(15, 2);
        aliquotaIVA                : Decimal(6, 2);
        ritenuta                   : String(2);
        natura                     : String(4);
        riferimentoAmministrazione : String(20)
  }

  entity ScontoMaggiorazione {
    key ID                : UUID;
        body_Id           : UUID;
        dettaglioLinee_Id : UUID;
        tipo              : String(2);
        percentuale       : Decimal(6, 2);
        importo           : Decimal(21, 2);
  }

  entity Causale {
    key ID          : UUID;
        body_Id     : UUID;
        descrizione : String(200);
  }

  entity DatiOrdineAcquisto {
    key ID                        : UUID;
        body_Id                   : UUID;
        riferimentoNumeroLinea    : Association to many RiferimentoNumeroLinea
                                      on riferimentoNumeroLinea.datiOrdineAcquisto_Id = $self.ID;
        idDocumento               : String(20);
        data                      : Date;
        numItem                   : String(20);
        codiceCommessaConvenzione : String(100);
        codiceCUP                 : String(15);
        codiceCIG                 : String(15);
  }

  entity RiferimentoNumeroLinea {
    key ID                     : UUID;
        datiOrdineAcquisto_Id  : UUID;
        riferimentoNumeroLinea : Integer;
  }

  entity RiferimentoNumeroLineaDDT {
    key ID                     : UUID;
        datiDDT_Id             : UUID;
        riferimentoNumeroLinea : Integer;
  }

  entity DettaglioLinee {
    key ID                           : UUID;
        body_Id                      : UUID;
        bodyPOIntegrationInfo        : Association to one POIntegrationInfoBody;
        bodyGLAccountIntegrationInfo : Association to one GLAccountIntegrationInfoBody;
        numeroLinea                  : Integer;
        tipoCessazionePrestazione    : String(2);
        codiceArticolo               : Association to many CodiceArticolo
                                         on codiceArticolo.dettaglioLinee_Id = $self.ID;
        descrizione                  : String(500);
        quantita                     : Decimal(21, 4);
        unitaMisura                  : String(10);
        dataInizioPeriodo            : Date;
        dataFinePeriodo              : Date;
        prezzoUnitario               : Decimal(21, 4);
        scontoMaggiorazione          : Association to many ScontoMaggiorazione
                                         on scontoMaggiorazione.dettaglioLinee_Id = $self.ID;
        prezzoTotale                 : Decimal(21, 4);
        aliquotaIVA                  : Decimal(6, 4);
        ritenuta                     : String(2);
        natura                       : String(4);
        riferimentoAmministrazione   : String(20);
        altriDatiGestionali          : Association to many AltriDatiGestionali
                                         on altriDatiGestionali.dettaglioLinee_Id = $self.ID;
  }

  entity CodiceArticolo {
    key ID                : UUID;
        dettaglioLinee_Id : UUID;
        codiceTipo        : String(35);
        codiceValore      : String(35);
  }

  entity AltriDatiGestionali {
    key ID                : UUID;
        dettaglioLinee_Id : UUID;
        tipoDato          : String(10);
        riferimentoTesto  : String(60);
        riferimentoNumero : Decimal(21);
        riferimentoData   : Date;
  }

  entity DatiRiepilogo {
    key ID                   : UUID;
        body_Id              : UUID;
        aliquotaIVA          : Decimal(6, 2);
        natura               : String(4);
        speseAccessorie      : Decimal(15, 2);
        arrotondamento       : Decimal(21, 2);
        imponibileImporto    : Decimal(15, 2);
        imposta              : Decimal(15, 2);
        esigibilitaIVA       : String(1);
        riferimentoNormativo : String(100);
  }

  entity DatiPagamento {
    key ID                  : UUID;
        body_Id             : UUID;
        condizioniPagamento : String(4);
        dettaglioPagamento  : Association to many DettaglioPagamento
                                on dettaglioPagamento.datiPagamento_Id = $self.ID;
  }

  entity DettaglioPagamento {
    key ID                              : UUID;
        datiPagamento_Id                : UUID;
        beneficiario                    : String(200);
        modalitaPagamento               : String(4);
        dataRiferimentoTerminiPagamento : Date;
        giorniTerminiPagamento          : Integer;
        dataScadenzaPagamento           : Date;
        importoPagamento                : Decimal(15, 2);
        codUfficioPostale               : String(20);
        cognomeQuietanzante             : String(60);
        nomeQuietanzante                : String(60);
        CFQuietanzante                  : String(16);
        titoloQuietanzante              : String(10);
        istitutoFinanziario             : String(80);
        IBAN                            : String(34);
        ABI                             : String(5);
        CAB                             : String(5);
        BIC                             : String(11);
        scontoPagamentoAnticipato       : Decimal(15, 2);
        dataLimitePagamentoAnticipato   : Date;
        penalitaPagamentiRitardati      : Decimal(15, 2);
        dataDecorrenzaPenale            : Date;
        codicePagamento                 : String(60);
  }

  entity Allegati {
    key ID                    : UUID;
        body_Id               : UUID;
        nomeAttachment        : String(60);
        algoritmoCompressione : String(10);
        formatoAttachment     : String(10);
        descrizioneAttachment : String(100);
        attachment            : LargeString;
  }

  entity DatiDDT {
    key ID                     : UUID;
        body_Id                : UUID;
        numeroDDT              : String(20);
        dataDDT                : Date;
        riferimentoNumeroLinea : Association to many RiferimentoNumeroLineaDDT
                                   on riferimentoNumeroLinea.datiDDT_Id = $self.ID;
  }

}

/**
   * View which, for each invoice, contains all info about its elaboration like user who has performed
   * an action, who has been assigned to a task and other info strictly related to invoice
   */
@cds.persistence.exists  @cds.persistence.calcview
entity V_DOC_EXTENDED {
  key PACKAGEID                                                   : String(36)   @title: 'PACKAGEID: PACKAGEID';
      MODUSER_LASTNAME                                            : String(50)   @title: 'MODUSER_LASTNAME: MODUSER_LASTNAME';
      MODUSER_FIRSTNAME                                           : String(50)   @title: 'MODUSER_FIRSTNAME: MODUSER_FIRSTNAME';
      LASTCHANGEDBYNAME                                           : String(101)  @title: 'LASTCHANGEDBYNAME: LASTCHANGEDBYNAME';
      ASSIGNUSER_LASTNAME                                         : String(50)   @title: 'ASSIGNUSER_LASTNAME: LASTNAME';
      LOCKUSER_LASTNAME                                           : String(50)   @title: 'LOCKUSER_LASTNAME: LASTNAME';
      ASSIGNUSER_FIRSTNAME                                        : String(50)   @title: 'ASSIGNUSER_FIRSTNAME: FIRSTNAME';
      ASSIGNEDTONAME                                              : String(101)  @title: 'ASSIGNEDTONAME: AssignedToName';
      LOCKUSER_FIRSTNAME                                          : String(50)   @title: 'LOCKUSER_FIRSTNAME: FIRSTNAME';
      ACTIONUSER_FIRSTNAME                                        : String(50)   @title: 'ACTIONUSER_FIRSTNAME: FIRSTNAME';
      ACTIONUSER_LASTNAME                                         : String(50)   @title: 'ACTIONUSER_LASTNAME: LASTNAME';
      LOCKEDBYNAME                                                : String(101)  @title: 'LOCKEDBYNAME: LockedByName';
      ACTIONBYNAME                                                : String(101)  @title: 'ACTIONBYNAME: ActionByName';
      DOC_STATUS                                                  : String(10)   @title: 'DOC_STATUS: STATUS';
      CREATEDAT                                                   : Timestamp    @title: 'CREATEDAT: CREATEDAT';
      CREATEDBY                                                   : String(255)  @title: 'CREATEDBY: CREATEDBY';
      LASTCHANGEDON                                               : Timestamp    @title: 'LASTCHANGEDON: MODIFIEDAT';
      action                                                      : String(10)   @title: 'ACTION: ACTION';
      COMPANYCODE                                                 : String(5000) @title: 'COMPANYCODE: COMPANYCODE';
      LASTCHANGEDBY                                               : String(255)  @title: 'LASTCHANGEDBY: MODIFIEDBY';
      LOCKEDAT                                                    : String       @title: 'LOCKEDAT: LOCKEDAT';
      LOCKEDBY                                                    : String(255)  @title: 'LOCKEDBY: LOCKEDBY';
      ASSIGNEDTO                                                  : String(255)  @title: 'ASSIGNEDTO: ASSIGNEDTO';
      ACTIONBY                                                    : String(255)  @title: 'ACTIONBY: ACTIONBY';
      REFERENCEDOCUMENT                                           : String(10)   @title: 'REFERENCEDOCUMENT: REFERENCEDOCUMENT';
      FISCALYEAR                                                  : String(4)    @title: 'FISCALYEAR: FISCALYEAR';
      INVOICENUMBER                                               : String(20)   @title: 'INVOICENUMBER: DATIGENERALI_DATIGENERALIDOCUMENTO_NUMERO';
      ID_OCCUR                                                    : String(36)   @title: 'ID_OCCUR: ID_OCCUR';
      DOCCATEGORY                                                 : String(13)   @title: 'DOCCATEGORY: DOCCATEGORY';
      IMPORTOTOTALEDOCUMENTO                                      : Decimal(15)  @title: 'IMPORTOTOTALEDOCUMENTO: DATIGENERALI_DATIGENERALIDOCUMENTO_IMPORTOTOTALEDOCUMENTO';
      CESSIONARIOCOMMITTENTE_DATIANAGRAFICI_IDFISCALEIVA_IDPAESE  : String(2)    @title: 'CESSIONARIOCOMMITTENTE_DATIANAGRAFICI_IDFISCALEIVA_IDPAESE: CESSIONARIOCOMMITTENTE_DATIANAGRAFICI_IDFISCALEIVA_IDPAESE';
      CESSIONARIOCOMMITTENTE_DATIANAGRAFICI_IDFISCALEIVA_IDCODICE : String(28)   @title: 'CESSIONARIOCOMMITTENTE_DATIANAGRAFICI_IDFISCALEIVA_IDCODICE: CESSIONARIOCOMMITTENTE_DATIANAGRAFICI_IDFISCALEIVA_IDCODICE';
      VAT                                                         : String(30)   @title: 'VAT: VAT';
}
