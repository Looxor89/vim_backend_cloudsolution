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
    entity InvoiceIntegrationInfo       as projection on vim.InvoiceIntegrationInfo;
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
    action   assign(payload : assignPayload)                        returns array of String;
    action   forward(payload : forwardPayload)                      returns array of String;
    action   unlock(payload : unlockPayload)                        returns array of String;
    action   lock(payload : lockPayload)                            returns array of String;
    action   reject(payload : rejectPayload)                        returns array of String;
    action   save(payload : savePayload)                            returns array of String;
    action   massiveSubmit(payload : array of massiveSubmitPayload) returns array of String;
    action   submit(payload : submitPayload)                        returns array of String;
    action   addNotes(payload : addNotesPayload)                    returns array of String;
    action   addDoc(payload : array of addDocPayload)               returns array of String;
    action   addAttachment(payload : addAttachmentPayload)          returns array of String;
    action   removeJob(payload : removeJobPayload)                  returns array of String;
    action   setMainJob(payload : setMainJobPayload)                returns array of String;

    type assignPayload {
        PackageId  : String;
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

    type rejectPayload {
        PackageId : String;
        sMode     : String;
    };

    type savePayload {
        PackageId                             : String;
        Invoice                               : LargeString;
        RemovedSupplierInvoiceWhldgTaxRecords : array of RemovedSupplierInvoiceWhldgTaxRecords;
        RemovedPoLineDetails                  : array of RemovedPoLineDetails;
        RemovedGlAccountLineDetails           : array of RemovedGlAccountLineDetails;
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
        PackageId : String;
        Invoice   : LargeString;
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
