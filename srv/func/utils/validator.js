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
        ID: Joi.string().max(36).required(),
        datiTrasmissione_IdPaese: Joi.string().max(2).allow(null),
        datiTrasmissione_IdCodice: Joi.string().max(28).allow(null),
        datiTrasmissione_ProgressivoInvio: Joi.string().max(10).allow(null),
        datiTrasmissione_FormatoTrasmissione: Joi.string().max(5).allow(null),
        datiTrasmissione_CodiceDestinatario: Joi.string().max(7).allow(null),
        datiTrasmissione_ContattiTrasmittente_Telefono: Joi.string().max(12).allow(null),
        datiTrasmissione_ContattiTrasmittente_Email: Joi.string().email().allow(null),
        datiTrasmissione_PECDestinatario: Joi.string().email().allow(null),
        cedentePrestatore_DatiAnagrafici_IdFiscaleIVA_IdPaese: Joi.string().max(2).allow(null),
        cedentePrestatore_DatiAnagrafici_IdFiscaleIVA_IdCodice: Joi.string().max(28).allow(null),
        cedentePrestatore_DatiAnagrafici_CodiceFiscale: Joi.string().max(16).allow(null),
        cedentePrestatore_DatiAnagrafici_Anagrafica_Denominazione: Joi.string().max(80).allow(null),
        cedentePrestatore_DatiAnagrafici_Anagrafica_Nome: Joi.string().max(60).allow(null),
        cedentePrestatore_DatiAnagrafici_Anagrafica_Cognome: Joi.string().max(60).allow(null),
        cedentePrestatore_DatiAnagrafici_Anagrafica_Titolo: Joi.string().max(10).allow(null),
        cedentePrestatore_DatiAnagrafici_Anagrafica_CodEORI: Joi.string().max(17).allow(null),
        cedentePrestatore_DatiAnagrafici_AlboProfessionale: Joi.string().max(60).allow(null),
        cedentePrestatore_DatiAnagrafici_ProvinciaAlbo: Joi.string().max(2).allow(null),
        cedentePrestatore_DatiAnagrafici_NumeroIscrizioneAlbo: Joi.string().max(60).allow(null),
        cedentePrestatore_DatiAnagrafici_DataIscrizioneAlbo: Joi.date().allow(null),
        cedentePrestatore_DatiAnagrafici_RegimeFiscale: Joi.string().max(4).allow(null),
        cedentePrestatore_Sede_Indirizzo: Joi.string().max(60).allow(null),
        cedentePrestatore_Sede_NumeroCivico: Joi.string().max(8).allow(null),
        cedentePrestatore_Sede_CAP: Joi.string().max(5).allow(null),
        cedentePrestatore_Sede_Comune: Joi.string().max(60).allow(null),
        cedentePrestatore_Sede_Provincia: Joi.string().max(2).allow(null),
        cedentePrestatore_Sede_Nazione: Joi.string().max(2).allow(null),
        cedentePrestatore_StabileOrganizzazione_Indirizzo: Joi.string().max(60).allow(null),
        cedentePrestatore_StabileOrganizzazione_CAP: Joi.string().max(5).allow(null),
        cedentePrestatore_StabileOrganizzazione_Comune: Joi.string().max(60).allow(null),
        cedentePrestatore_StabileOrganizzazione_Provincia: Joi.string().max(2).allow(null),
        cedentePrestatore_StabileOrganizzazione_Nazione: Joi.string().max(2).allow(null),
        cedentePrestatore_IscrizioneREA_Ufficio: Joi.string().max(2).allow(null),
        cedentePrestatore_IscrizioneREA_NumeroREA: Joi.string().max(20).allow(null),
        cedentePrestatore_IscrizioneREA_CapitaleSociale: Joi.string().max(15).allow(null),
        cedentePrestatore_IscrizioneREA_SocioUnico: Joi.string().max(2).allow(null),
        cedentePrestatore_IscrizioneREA_StatoLiquidazione: Joi.string().max(2).allow(null),
        cedentePrestatore_Contatti_Telefono: Joi.string().max(12).allow(null),
        cedentePrestatore_Contatti_Fax: Joi.string().max(12).allow(null),
        cedentePrestatore_Contatti_Email: Joi.string().email().allow(null),
        cedentePrestatore_RiferimentoAmministrazione: Joi.string().max(20).allow(null),
        rappresentanteFiscale_DatiAnagrafici_IdFiscaleIVA_IdPaese: Joi.string().max(2).allow(null),
        rappresentanteFiscale_DatiAnagrafici_IdFiscaleIVA_IdCodice: Joi.string().max(28).allow(null),
        rappresentanteFiscale_DatiAnagrafici_CodiceFiscale: Joi.string().max(16).allow(null),
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Denominazione: Joi.string().max(80).allow(null),
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Nome: Joi.string().max(60).allow(null),
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Cognome: Joi.string().max(60).allow(null),
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_Titolo: Joi.string().max(10).allow(null),
        rappresentanteFiscale_DatiAnagrafici_Anagrafica_CodEORI: Joi.string().max(17).allow(null),
        cessionarioCommittente_DatiAnagrafici_IdFiscaleIVA_IdPaese: Joi.string().max(2).allow(null),
        cessionarioCommittente_DatiAnagrafici_IdFiscaleIVA_IdCodice: Joi.string().max(28).allow(null),
        cessionarioCommittente_DatiAnagrafici_CodiceFiscale: Joi.string().max(16).allow(null),
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Denominazione: Joi.string().max(80).allow(null),
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Nome: Joi.string().max(60).allow(null),
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Cognome: Joi.string().max(60).allow(null),
        cessionarioCommittente_DatiAnagrafici_Anagrafica_Titolo: Joi.string().max(10).allow(null),
        cessionarioCommittente_DatiAnagrafici_Anagrafica_CodEORI: Joi.string().max(17).allow(null),
        cessionarioCommittente_Sede_Indirizzo: Joi.string().max(60).allow(null),
        cessionarioCommittente_Sede_NumeroCivico: Joi.string().max(8).allow(null),
        cessionarioCommittente_Sede_CAP: Joi.string().max(5).allow(null),
        cessionarioCommittente_Sede_Comune: Joi.string().max(60).allow(null),
        cessionarioCommittente_Sede_Provincia: Joi.string().max(2).allow(null),
        cessionarioCommittente_Sede_Nazione: Joi.string().max(2).allow(null),
        cessionarioCommittente_StabileOrganizzazione_Indirizzo: Joi.string().max(60).allow(null),
        cessionarioCommittente_StabileOrganizzazione_CAP: Joi.string().max(5).allow(null),
        cessionarioCommittente_StabileOrganizzazione_Comune: Joi.string().max(60).allow(null),
        cessionarioCommittente_StabileOrganizzazione_Provincia: Joi.string().max(2).allow(null),
        cessionarioCommittente_StabileOrganizzazione_Nazione: Joi.string().max(2).allow(null),
        rappresentanteFiscale_RappresentanteFiscale_IdFiscaleIVA_IdPaese: Joi.string().max(2).allow(null),
        rappresentanteFiscale_RappresentanteFiscale_IdFiscaleIVA_IdCodice: Joi.string().max(28).allow(null),
        rappresentanteFiscale_RappresentanteFiscale_Denominazione: Joi.string().max(60).allow(null),
        rappresentanteFiscale_RappresentanteFiscale_Nome: Joi.string().max(60).allow(null),
        rappresentanteFiscale_RappresentanteFiscale_Cognome: Joi.string().max(60).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_IdFiscaleIVA_IdPaese: Joi.string().max(2).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_IdFiscaleIVA_IdCodice: Joi.string().max(28).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_CodiceFiscale: Joi.string().max(16).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Denominazione: Joi.string().max(80).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Nome: Joi.string().max(60).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Cognome: Joi.string().max(60).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_Titolo: Joi.string().max(10).allow(null),
        terzoIntermediarioOSoggettoEmittente_DatiAnagrafici_Anagrafica_CodEORI: Joi.string().max(17).allow(null),
        soggettoEmittente: Joi.string().max(2).allow(null),
        navigation_to_PackageId: Joi.string().max(36).required(),
        body: Joi.array().items(
            Joi.object().keys({
                ID: Joi.string().max(36),
                header_Id: Joi.string().max(36),
                datiGenerali_DatiGeneraliDocumento_TipoDocumento: Joi.string().max(4).allow(null),
                datiGenerali_DatiGeneraliDocumento_Divisa: Joi.string().max(3).allow(null),
                datiGenerali_DatiGeneraliDocumento_Data: Joi.date().allow(null),
                datiGenerali_DatiGeneraliDocumento_Numero: Joi.string().max(20).allow(null),
                datiGenerali_DatiGeneraliDocumento_DatiBollo_BolloVirtuale: Joi.string().max(2).allow(null),
                datiGenerali_DatiGeneraliDocumento_DatiBollo_ImportoBollo: Joi.number().precision(2).allow(null),
                datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento: Joi.number().precision(2).allow(null),
                datiGenerali_DatiGeneraliDocumento_Arrotondamento: Joi.number().precision(2).allow(null),
                datiGenerali_DatiGeneraliDocumento_Art73: Joi.string().max(2).allow(null),
                datiVeicolo_Data: Joi.date().allow(null),
                datiVeicolo_TotalePercorso: Joi.string().max(15).allow(null),
                datiGenerali_DatiGeneraliDocumento_DatiRitenuta: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        tipoRitenuta: Joi.string().max(4).allow(null),
                        importoRitenuta: Joi.number().precision(4).allow(null),
                        aliquotaRitenuta: Joi.number().precision(4).allow(null),
                        causalePagamento: Joi.string().max(2).allow(null),
                    })
                ),
                datiGenerali_DatiGeneraliDocumento_DatiCassaPrevidenziale: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        tipoCassa: Joi.string().max(4).allow(null),
                        aICassa: Joi.number().precision(4).allow(null),
                        importoContributoCassa: Joi.number().precision(4).allow(null),
                        imponibileCassa: Joi.number().precision(4).allow(null),
                        aliquotaIVA: Joi.number().precision(4).allow(null),
                        ritenuta: Joi.string().max(2).allow(null),
                        natura: Joi.string().max(4).allow(null),
                        riferimentoAmministrazione: Joi.string().max(20).allow(null)
                    })
                ),
                datiGenerali_DatiGeneraliDocumento_ScontoMaggiorazione: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        dettaglioLinee_Id: Joi.string().max(36),
                        tipo: Joi.string().max(2).allow(null),
                        percentuale: Joi.number().precision(4).allow(null),
                        importo: Joi.number().precision(4).allow(null),
                    })
                ),
                datiGenerali_DatiGeneraliDocumento_Causale: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        descrizione: Joi.string().max(200).allow(null)
                    })
                ),
                datiGenerali_DatiOrdineAcquisto: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        riferimentoNumeroLinea: Joi.array().items(
                            Joi.object().keys({
                                ID: Joi.string().max(36),
                                datiOrdineAcquisto_Id: Joi.string().max(36),
                                riferimentoNumeroLinea: Joi.number().integer
                            })),
                        idDocumento: Joi.string().max(20).allow(null),
                        data: Joi.date().allow(null),
                        numItem: Joi.string().max(20).allow(null),
                        codiceCommessaConvenzione: Joi.string().max(100).allow(null),
                        codiceCUP: Joi.string().max(15).allow(null),
                        codiceCIG: Joi.string().max(15).allow(null),
                    })
                ),
                datiBeniServizi_DettaglioLinee: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        numeroLinea: Joi.number().integer().allow(null),
                        tipoCessazionePrestazione: Joi.string().max(2).allow(null),
                        codiceArticolo: Joi.array().items(
                            Joi.object().keys({
                                ID: Joi.string().max(36),
                                dettaglioLinee_Id: Joi.string().max(36),
                                codiceTipo: Joi.string().max(35),
                                codiceValore: Joi.string().max(35),
                            })),
                        descrizione: Joi.string().max(500).allow(null),
                        quantita: Joi.number().precision(4).allow(null),
                        unitaMisura: Joi.string().max(10).allow(null),
                        dataInizioPeriodo: Joi.date().allow(null),
                        dataFinePeriodo: Joi.date().allow(null),
                        prezzoUnitario: Joi.number().precision(4).allow(null),
                        scontoMaggiorazione: Joi.array().items(
                            Joi.object().keys({
                                ID: Joi.string().max(36),
                                body_Id: Joi.string().max(36),
                                numeroLinea: Joi.number().integer().allow(null),
                                dettaglioLinee_Id: Joi.string().max(36),
                                tipo: Joi.string().max(2).allow(null),
                                percentuale: Joi.number().precision(4).allow(null),
                                importo: Joi.number().precision(4).allow(null)
                            })),
                        prezzoTotale: Joi.number().precision(4).allow(null),
                        aliquotaIVA: Joi.number().precision(4).allow(null),
                        ritenuta: Joi.string().max(2).allow(null),
                        natura: Joi.string().max(4).allow(null),
                        riferimentoAmministrazione: Joi.string().max(20).allow(null),
                        altriDatiGestionali: Joi.array().items(
                            Joi.object().keys({
                                ID: Joi.string().max(36),
                                dettaglioLinee_Id: Joi.string().max(36),
                                tipoDato: Joi.string().max(10).allow(null),
                                riferimentoTesto: Joi.string().max(60).allow(null),
                                riferimentoNumero: Joi.number().precision(21).allow(null),
                                riferimentoData: Joi.date().allow(null)
                            }))
                    })
                ),
                datiBeniServizi_DatiRiepilogo: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        aliquotaIVA: Joi.number().precision(4).allow(null),
                        natura: Joi.string().max(4).allow(null),
                        speseAccessorie: Joi.number().precision(4).allow(null),
                        arrotondamento: Joi.number().precision(4).allow(null),
                        imponibileImporto: Joi.number().precision(4).allow(null),
                        imposta: Joi.number().precision(4).allow(null),
                        esigibilitaIVA: Joi.string().max(1).allow(null),
                        riferimentoNormativo: Joi.string().max(100).allow(null),
                    })
                ),
                datiPagamento: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        condizioniPagamento: Joi.string().max(4).allow(null),
                        dettaglioPagamento: Joi.array().items(
                            Joi.object().keys({
                                ID: Joi.string().max(36),
                                datiPagamento_Id: Joi.string().max(36),
                                beneficiario: Joi.string().max(200).allow(null),
                                modalitaPagamento: Joi.string().max(4).allow(null),
                                dataRiferimentoTerminiPagamento: Joi.date().allow(null),
                                giorniTerminiPagamento: Joi.number().integer().allow(null),
                                dataScadenzaPagamento: Joi.date().allow(null),
                                importoPagamento: Joi.number().precision(4).allow(null),
                                codUfficioPostale: Joi.string().max(20).allow(null),
                                cognomeQuietanzante: Joi.string().max(60).allow(null),
                                nomeQuietanzante: Joi.string().max(60).allow(null),
                                CFQuietanzante: Joi.string().max(16).allow(null),
                                titoloQuietanzante: Joi.string().max(10).allow(null),
                                istitutoFinanziario: Joi.string().max(80).allow(null),
                                IBAN: Joi.string().max(34).allow(null),
                                ABI: Joi.string().max(5).allow(null),
                                CAB: Joi.string().max(5).allow(null),
                                BIC: Joi.string().max(11).allow(null),
                                scontoPagamentoAnticipato: Joi.number().precision(4).allow(null),
                                dataLimitePagamentoAnticipato: Joi.date().allow(null),
                                penalitaPagamentiRitardati: Joi.number().precision(4).allow(null),
                                dataDecorrenzaPenale: Joi.date().allow(null),
                                codicePagamento: Joi.string().max(60).allow(null),
                            }))
                    })
                ),
                allegati: Joi.array().items(Joi.object().keys({
                    ID: Joi.string().max(36),
                    body_Id: Joi.string().max(36),
                    nomeAttachment: Joi.string().max(60).allow(null),
                    algoritmoCompressione: Joi.string().max(10).allow(null),
                    formatoAttachment: Joi.string().max(10).allow(null),
                    descrizioneAttachment: Joi.string().max(100).allow(null),
                    attachment: Joi.string()
                })
                ),
                datiGenerali_DatiDDT: Joi.array().items(
                    Joi.object().keys({
                        ID: Joi.string().max(36),
                        body_Id: Joi.string().max(36),
                        numeroDDT: Joi.string().max(20).allow(null),
                        dataDDT: Joi.date().allow(null),
                        riferimentoNumeroLinea: Joi.array().items(
                            Joi.object().keys({
                                ID: Joi.string().max(36),
                                datiDDT_Id: Joi.string().max(36),
                                riferimentoNumeroLinea: Joi.number().integer()
                            })
                        )
                    })
                )
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