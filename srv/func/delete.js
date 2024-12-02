const { checkWriteScope } = require('./utils/scopes');
const schema = require('./utils/validator');
const moment = require('moment');

"use strict";

module.exports = async (request, tx) => {
    // Validate incoming payload
    let { error } = schema.action_delete.validate(request.data.payload, { abortEarly: false });
    let valid = error == null;
    //If payload is valid then do delete
    if (!valid) {
        console.error(error);
        // If the payload does not correct, return a 422 Invalid POST Payload.
        throw new Error({
            code: '422',
            message: 'Error',
            target: 'Invalid query',
            status: 422
        });
    }

    // Extract payload data from the incoming request.
    const { PackagesId } = request.data.payload;
    if (!Array.isArray(PackagesId) || PackagesId.length === 0) {
        throw new Error({
            code: '400',
            message: 'Payload error',
            target: 'PackagesId array is invalid or empty.',
            status: 400 
        });
    }

    await Promise.all(PackagesId.map(async sPackageId => {
        try {
            const result = await tx.run(DELETE.from('DOC_PACK').where({ PackageId: sPackageId }));
            if (result === 0) {
                console.log(`No rows found for PackageId: ${sPackageId}`);
            }
        } catch (err) {
            console.error(`Error deleting PackageId: ${sPackageId}`, err);
            throw err;
        }
    }));

    // Return the status code and message.
    return {
        status: 201,
        message: `Invoice successfully deleted`
    };
    
};
