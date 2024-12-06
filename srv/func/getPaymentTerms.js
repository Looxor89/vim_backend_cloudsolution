const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    const oResultPaymentTermsRequest = await serviceRequestS4_HANA.get(process.env['Path_API_PAYMENTTERMS']);
    return { status: 200, result: oResultPaymentTermsRequest, message: 'Executed' };
};