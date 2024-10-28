const { checkSaveScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkSaveScope(request.req)) {
        // Extract payload data from the incoming request.
        let {
            PackageId,
            Invoice
        } = request.data.payload,
            modifiedBy = request.req.authInfo.getLogonName(),
            modifiedAt = new Date(),
            data;
        let jsonInvoice = JSON.parse(Invoice)
        // Validate incoming payload
        let { error } = schema.action_save_submit.validate(jsonInvoice, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            try {
                if (jsonInvoice.body[0].allegati) {
                    jsonInvoice.body[0].allegati.forEach(async oAttachment => {
                        let query = UPDATE('Allegati')
                            .set(oAttachment)
                            .where(`ID = '${oAttachment.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].allegati;

                if (jsonInvoice.body[0].datiBeniServizi_DatiRiepilogo) {
                    jsonInvoice.body[0].datiBeniServizi_DatiRiepilogo.forEach(async oGoodsRecap => {
                        let query = UPDATE('DatiRiepilogo')
                            .set(oGoodsRecap)
                            .where(`ID = '${oGoodsRecap.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiBeniServizi_DatiRiepilogo;


                if (jsonInvoice.body[0].datiBeniServizi_DettaglioLinee) {
                    jsonInvoice.body[0].datiBeniServizi_DettaglioLinee.forEach(async oGoodsLineDetail => {
                        if (oGoodsLineDetail.codiceArticolo) {
                            oGoodsLineDetail.codiceArticolo.forEach(async oArticle => {
                                let query = UPDATE('CodiceArticolo')
                                    .set(oArticle)
                                    .where(`ID = '${oArticle.ID}'`);

                                data = await tx.run(query);
                                handleQueryError(data);
                            })
                        }
                        delete oGoodsLineDetail.codiceArticolo;

                        if (oGoodsLineDetail.scontoMaggiorazione) {
                            oGoodsLineDetail.scontoMaggiorazione.forEach(async oDiscount => {
                                let query = UPDATE('ScontoMaggiorazione')
                                    .set(oDiscount)
                                    .where(`ID = '${oDiscount.ID}'`);

                                data = await tx.run(query);
                                handleQueryError(data);
                            })
                        }
                        delete oGoodsLineDetail.scontoMaggiorazione;

                        if (oGoodsLineDetail.altriDatiGestionali) {
                            oGoodsLineDetail.altriDatiGestionali.forEach(async oOtherData => {
                                let query = UPDATE('AltriDatiGestionali')
                                    .set(oOtherData)
                                    .where(`ID = '${oOtherData.ID}'`);

                                data = await tx.run(query);
                                handleQueryError(data);
                            })
                        }
                        delete oGoodsLineDetail.altriDatiGestionali;

                        let query = UPDATE('DettaglioLinee')
                            .set(oGoodsLineDetail)
                            .where(`ID = '${oGoodsLineDetail.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiBeniServizi_DettaglioLinee;

                if (jsonInvoice.body[0].datiGenerali_DatiDDT) {
                    jsonInvoice.body[0].datiGenerali_DatiDDT.forEach(async oGeneralDataDDT => {
                        if (oGeneralDataDDT.riferimentoNumeroLinea) {
                            oGeneralDataDDT.riferimentoNumeroLinea.forEach(async oLineNumberRef => {
                                let query = UPDATE('RiferimentoNumeroLineaDDT')
                                    .set(oLineNumberRef)
                                    .where(`ID = '${oLineNumberRef.ID}'`);

                                data = await tx.run(query);
                                handleQueryError(data);
                            })
                        }
                        delete oGeneralDataDDT.riferimentoNumeroLinea;

                        let query = UPDATE('DatiDDT')
                            .set(oGeneralDataDDT)
                            .where(`ID = '${oGeneralDataDDT.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiGenerali_DatiDDT;

                if (jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_Causale) {
                    jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_Causale.forEach(async oCausal => {
                        let query = UPDATE('Causale')
                            .set(oCausal)
                            .where(`ID = '${oCausal.ID}'`);

                        data = await tx.run(query); -
                            handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_Causale;

                if (jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_DatiCassaPrevidenziale) {
                    jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_DatiCassaPrevidenziale.forEach(async oSocialSecurity => {
                        let query = UPDATE('DatiCassaPrevidenziale')
                            .set(oSocialSecurity)
                            .where(`ID = '${oSocialSecurity.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_DatiRitenuta;

                if (jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_DatiRitenuta) {
                    jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_DatiRitenuta.forEach(async oWithholding => {
                        let query = UPDATE('DatiRitenuta')
                            .set(oWithholding)
                            .where(`ID = '${oWithholding.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_DatiRitenuta;

                if (jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_ScontoMaggiorazione) {
                    jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_ScontoMaggiorazione.forEach(async oDiscount => {
                        let query = UPDATE('ScontoMaggiorazione')
                            .set(oDiscount)
                            .where(`ID = '${oDiscount.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    })
                }
                delete jsonInvoice.body[0].datiGenerali_DatiGeneraliDocumento_ScontoMaggiorazione;

                if (jsonInvoice.body[0].datiGenerali_DatiOrdineAcquisto) {
                    jsonInvoice.body[0].datiGenerali_DatiOrdineAcquisto.forEach(async oPurchaseOrder => {
                        if (oPurchaseOrder.riferimentoNumeroLinea) {
                            oPurchaseOrder.riferimentoNumeroLinea.forEach(async oLineNumberRef => {
                                let query = UPDATE('RiferimentoNumeroLinea')
                                    .set(oLineNumberRef)
                                    .where(`ID = '${oLineNumberRef.ID}'`);

                                data = await tx.run(query);
                                handleQueryError(data);
                            })
                        }
                        delete oPurchaseOrder.riferimentoNumeroLinea;

                        let query = UPDATE('DatiOrdineAcquisto')
                            .set(oPurchaseOrder)
                            .where(`ID = '${oPurchaseOrder.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiGenerali_DatiOrdineAcquisto;

                if (jsonInvoice.body[0].datiPagamento) {
                    jsonInvoice.body[0].datiPagamento.forEach(async oPaymentData => {
                        if (oPaymentData.dettaglioPagamento) {
                            oPaymentData.dettaglioPagamento.forEach(async oPaymentDetail => {
                                let query = UPDATE('DettaglioPagamento')
                                    .set(oPaymentDetail)
                                    .where(`ID = '${oPaymentDetail.ID}'`);

                                data = await tx.run(query);
                                handleQueryError(data);
                            })
                        }
                        delete oPaymentData.dettaglioPagamento;

                        let query = UPDATE('DatiPagamento')
                            .set(oPaymentData)
                            .where(`ID = '${oPaymentData.ID}'`);

                        data = await tx.run(query);
                        handleQueryError(data);
                    });
                }
                delete jsonInvoice.body[0].datiPagamento;

                let bodyQuery = UPDATE('FatturaElettronicaBody')
                    .set(jsonInvoice.body[0])
                    .where(`ID = '${jsonInvoice.body[0].ID}'`);

                data = await tx.run(bodyQuery);
                handleQueryError(data);
                delete jsonInvoice.body;

                let headerQuery = UPDATE('FatturaElettronica')
                    .set(jsonInvoice)
                    .where(`ID = '${jsonInvoice.ID}'`);

                data = await tx.run(headerQuery);
                handleQueryError(data);

                async function handleQueryError(data) {
                    // Return the result with status code, number of affected rows as count, and message.
                    if (data == null || data == undefined) {
                        await tx.rollback();
                        return {
                            status: 500,
                            message: 'Update failed'
                        };
                    }
                }

                // Defining update dock_pack query
                updateDocPackQuery = UPDATE('DOC_PACK')
                    .set(`ModifiedBy = '${modifiedBy}', ModifiedAt = '${modifiedAt}'`)
                    .where(`PackageId = '${PackageId}'`);
                // Execute the query and retrieve the data from the database.
                data = await tx.run(updateDocPackQuery);

                // Return the result with status code, number of affected rows as count, and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Update failed'
                    };
                }

                // Return the status code and message.
                return {
                    status: 201,
                    message: `Data stored in database`
                };

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during save operation: ${err}`);
                await tx.rollback(err);
                // Return a 500 Internal Server Error response in case of an error.
                return {
                    status: 500,
                    message: 'Internal server error'
                };
            }
        } else {
            console.error(error);
            // If the payload does not correct, return a 422 Invalid POST Payload.
            return {
                code: '422',
                message: 'Error',
                target: 'Invalid POST Payload',
                status: 422
            };

        }
    } else {
        // If the user does not have the necessary permissions, return a 403 Forbidden response.
        return {
            code: '403',
            message: 'Forbidden',
            target: 'Missing the assign scope',
            status: 403
        };
    }
};
