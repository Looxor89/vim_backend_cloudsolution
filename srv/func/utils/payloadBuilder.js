// utils/payloadBuilder.js

const { getDateWithMilliseconds, getDateWithMillisecondsWithoutParam } = require('./utilities');

function glAccountBuildPayload(jsonInvoice) {
    const oBody = jsonInvoice.body[0];
    let oPayload = {
        CompanyCode: "CLR1", // hardcoded value
        DocumentDate: getDateWithMilliseconds(oBody.datiGenerali_DatiGeneraliDocumento_Data),
        PostingDate: getDateWithMillisecondsWithoutParam(),
        InvoicingParty: "23300001", // hardcoded value
        DocumentCurrency: oBody.datiGenerali_DatiGeneraliDocumento_Divisa,
        InvoiceGrossAmount: String(oBody.datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento) || null,
        DocumentHeaderText: "TEST_API", // hardcoded value
        PaymentTerms: "0004", // hardcoded value
        AccountingDocumentType: oBody.datiGenerali_DatiGeneraliDocumento_TipoDocumento,
        SupplyingCountry: "IT", // hardcoded value
        PaymentMethod: oBody.datiPagamento[0]?.dettaglioPagamento[0]?.modalitaPagamento || null,
        AssignmentReference: "TEST1", // hardcoded value
        SupplierPostingLineItemText: "TEST_API", // hardcoded value
        TaxIsCalculatedAutomatically: true,
        SuplrInvcIsCapitalGoodsRelated: true,
        TaxDeterminationDate: "/Date(1727733600000)/",
        InvoiceReceiptDate: getDateWithMilliseconds(oBody.datiGenerali_DatiGeneraliDocumento_Data),
        IsEUTriangularDeal: true,
        to_SupplierInvoiceItemGLAcct: { results: [] }
    };

    // Add line items
    oBody.datiBeniServizi_DettaglioLinee.forEach((oLineDetail, index) => {
        let sSupplierInvoiceItem = String(index + 1).padStart(4, '0');
        oPayload.to_SupplierInvoiceItemGLAcct.results.push({
            SupplierInvoiceItem: sSupplierInvoiceItem,
            CompanyCode: "CLR1",
            GLAccount: "21120000", // hardcoded value
            DocumentCurrency: oPayload.DocumentCurrency,
            SupplierInvoiceItemAmount: "200", // hardcoded value
            TaxCode: "99", // hardcoded value
            DebitCreditCode: "S" // hardcoded value
        });
    });

    return oPayload;
}

function poBuildPayload(jsonInvoice) {
    // do stuff
}

// Invoice mapping if body contains some element in datiGenerali_DatiOrdineAcquisto array then there are PurchaseOrders too
function buildPayload(jsonInvoice) {
    const oBody = jsonInvoice.body[0];
    let oPayload = {
        CompanyCode: "CLR1", // hardcoded value
        DocumentDate: getDateWithMilliseconds(oBody.datiGenerali_DatiGeneraliDocumento_Data),
        PostingDate: getDateWithMillisecondsWithoutParam(),
        InvoicingParty: "23300001", // hardcoded value
        DocumentCurrency: oBody.datiGenerali_DatiGeneraliDocumento_Divisa,
        InvoiceGrossAmount: String(oBody.datiGenerali_DatiGeneraliDocumento_ImportoTotaleDocumento) || null,
        DocumentHeaderText: "TEST_API", // hardcoded value
        PaymentTerms: "0004", // hardcoded value
        AccountingDocumentType: oBody.datiGenerali_DatiGeneraliDocumento_TipoDocumento,
        SupplyingCountry: "IT", // hardcoded value
        PaymentMethod: oBody.datiPagamento[0]?.dettaglioPagamento[0]?.modalitaPagamento || null,
        AssignmentReference: "TEST1", // hardcoded value
        SupplierPostingLineItemText: "TEST_API", // hardcoded value
        TaxIsCalculatedAutomatically: true,
        SuplrInvcIsCapitalGoodsRelated: true,
        TaxDeterminationDate: "/Date(1727733600000)/",
        InvoiceReceiptDate: getDateWithMilliseconds(oBody.datiGenerali_DatiGeneraliDocumento_Data),
        IsEUTriangularDeal: true,
        to_SupplierInvoiceItemGLAcct: { results: [] }
    };

    // Add line items
    oBody.datiBeniServizi_DettaglioLinee.forEach((oLineDetail, index) => {
        let sSupplierInvoiceItem = String(index + 1).padStart(4, '0');
        oPayload.to_SupplierInvoiceItemGLAcct.results.push({
            SupplierInvoiceItem: sSupplierInvoiceItem,
            CompanyCode: "CLR1",
            GLAccount: "21120000", // hardcoded value
            DocumentCurrency: oPayload.DocumentCurrency,
            SupplierInvoiceItemAmount: "200", // hardcoded value
            TaxCode: "99", // hardcoded value
            DebitCreditCode: "S" // hardcoded value
        });
    });

    return oPayload;
}

module.exports = {
    glAccountBuildPayload,
    poBuildPayload,
    buildPayload
}
