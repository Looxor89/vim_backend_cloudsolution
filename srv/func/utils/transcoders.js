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
    },
    paymentMethod : {
        "MP05": "T",
        "MP12": "H",
        "MP19": "E"
    },
    accountingDocumentType : {
        "TD01": "X1",
        "TD04": "Z1",
        "TD05": "W7",
        "TD10": "X2",
        "TD11": "X2",
        "TD16": "X5",
        "TD17": "X4",
        "TD18": "X4",
        "TD19": "X4",
        "TD20": "X4"
    },
    taxCode : {
        10.00: "A1",
        22.00: "A2",
        0.00 : {
            "N2.1" : "AK",
            "N3.1" : "AO",
            "N3.2" : "VU",
            "N3.3" : "VS",
            "N3.4" : "AO",
            "N3.5" : "AZ",
            "N3.6" : "AP",
            "N6.1" : "AA",
            "N6.2" : "AR",
            "N6.3" : "V6",
            "N6.4" : "V6",
            "N6.5" : "V6",
            "N6.6" : "V6",
            "N6.7" : "V6",
            "N6.8" : "V6",
            "N6.9" : "V6"
        }
    }
}

module.exports = transcoder;