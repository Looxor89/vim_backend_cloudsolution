const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    const serviceS4_HANA = await cds.connect.to(process.env['Destination_OData_S4HANA']);
    const serviceRequestS4_HANA = serviceS4_HANA.tx(request);
    let oResultWithholdingTaxesRequest = await serviceRequestS4_HANA.get(process.env['Path_API_WITHHOLDINGTAXES']+"&$select=WithholdingTaxCode");
    // remove duplicates
    oResultWithholdingTaxesRequest = Array.from(new Map(oResultWithholdingTaxesRequest.map(item => [item.WithholdingTaxCode, item])).values());
    return { status: 200, result: oResultWithholdingTaxesRequest, message: 'Executed' };
};