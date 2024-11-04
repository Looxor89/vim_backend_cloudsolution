const { checkWriteScope, checkAdminScope } = require('./utils/scopes');
const schema = require('./utils/validator');

"use strict";

module.exports = async (request, tx) => {
    // Check if the request has the necessary permissions.
    if (checkWriteScope(request.req)) {
        // Validate incoming payload
        let { error } = schema.action_lock.validate(request.data.payload, { abortEarly: false });
        let valid = error == null;
        //If payload is valid then do assign
        if (valid) {
            // Extract payload data from the incoming request.
            let {
                PackageId,
                LockUser
            } = request.data.payload,
                sMode = 'SET',
            result = {
                locked: null,
                lockedBy: null,
                lockedAt: null
            };
            let data, selectDockPackQuery;

            /**
             * Internal function for removing lock
             * @param {String} PackageId - package identification
             * @returns operation result
             */
            async function setLock(PackageId, LockedAt, LockedBy) {
                let result = {
                    locked: null,
                    lockedBy: null,
                    lockedAt: null
                };
                // Defining update dock_pack query
                let updateDocPackQuery = UPDATE('DOC_PACK')
                    .set({ LockedAt: LockedAt, LockedBy: LockedBy })
                    .where({ PackageId: PackageId });
                // Execute the query and retrieve the data from the database.
                let aResult = await tx.run(updateDocPackQuery);

                // Return the result with status code and message.
                if (aResult == null || aResult == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Lock failed'
                    };
                }

                // Define result
                result.locked = aResult.LockedBy !== null ? true : false;
                result.lockedBy = aResult.LockedBy;
                result.lockedAt = aResult.LockedAt !== null ? aResult.LockedAt : null;

                // Return the result as a response, with status code, data, and message.
                return {
                    status: 200,
                    result: result,
                    message: 'Executed'
                };
            }

            LockUser = LockUser == null ? request.req.authInfo.getLogonName() : LockUser;
            if (checkAdminScope(request.req)) {
                sMode = 'ADMIN_SET';
            }

            try {
                // Get locked info from dock_pack
                selectDockPackQuery = SELECT('*')
                    .from('DOC_PACK')
                    .where(`PackageId = '${PackageId}'`);
                // Execute the query and retrieve the data from the database.
                data = await tx.run(selectDockPackQuery);

                // Return the result with status code and message.
                if (data == null || data == undefined) {
                    await tx.rollback();
                    return {
                        status: 500,
                        message: 'Select locked info failed'
                    };
                }
                result.locked = data[0].LockedBy !== null ? true : false;
                result.lockedBy = data[0].LockedBy !== null ? data[0].LockedBy : null;
                result.lockedAt = data[0].LockedAt !== null ? data[0].LockedAt : null;

                // Mode evaluation
                switch (sMode) {
                    case 'SET':
                        // Allow set lock if lockedBy is null
                        if (result.lockedBy) {
                            return setLock(PackageId, new Date(), LockUser);
                        }
                        break;
                    case 'ADMIN_SET':
                        return setLock(PackageId, new Date(), LockUser);
                    default:
                        await tx.rollback();
                        return {
                            status: 500,
                            message: 'Internal server error'
                        };
                }

            } catch (err) {
                // Log any errors that occur during the query execution.
                console.error(`Error during set lock operation: ${err}`);
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
            target: 'Missing the write scope',
            status: 403
        };
    }
};
