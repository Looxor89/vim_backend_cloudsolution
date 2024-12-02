const { checkReadScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    // Extract PackageId from request query parameters
    const packageId = request.req.query.PackageId;
    if (!packageId) {
        // Return error response if PackageId is not provided
        return { status: 400, message: 'Bad Request' };
    }

    const headerFatturaElettronica = (await tx.run(
        SELECT('ID').from('FatturaElettronica').where({ navigation_to_PackageId: packageId })
    ))[0];
    const bodyFatturaElettronica = (await tx.run(
        SELECT('ID').from('FatturaElettronicaBody').where({ header_Id: headerFatturaElettronica.ID })
    ))[0];
    const allegati = (await tx.run(
        SELECT('*').from('Allegati').where({ body_Id: bodyFatturaElettronica.ID })
    ))[0];

    return { status: 200, result: allegati, message: 'Executed' };
};