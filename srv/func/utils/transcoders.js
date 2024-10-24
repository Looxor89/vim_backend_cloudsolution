const transcoder = {
    doxStatus : {
        "01": "PENDING",
        "02": "DONE",
        "03": "FAILED",
        "04": "CONFIRMED"
    },
    documentType : {
        "01": "Invoice",
        "02": "Payment Advice",
        "03": "Purchase Order"
    },
    docCategory : {
        "NONPOINV": "Non-PO Invoice",
        "POINV": "PO Invoice",
        "NONPOCREDM": "Non-PO Credit Memo",
        "POCREDM": "PO Credit Memo"
    }
}

module.exports = transcoder;