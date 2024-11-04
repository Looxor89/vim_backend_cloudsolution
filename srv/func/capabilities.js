const { checkAdminScope, checkManagerScope, checkOperatorScope, checkReviewer_SCMScope, checkReviewerScope, checkAuditorScope } = require('./utils/scopes');

"use strict";

module.exports = async (request, tx) => {
    let props = null;  // Initialize props to store permissions/actions for the user.

    props = {
        action: {
            forward: true,       // Allow forwarding actions.
            assign: true,        // Allow assigning tasks.
            reject: true,        // Allow rejecting items.
            managelock: true,    // Allow managing locks on tasks.
            save: true,          // Allow saving progress.
            savesap: true,       // Allow SAP-related saves.
            comment: true,       // Allow commenting.
            upload: true,        // Allow file uploads.
            download: true,      // Allow file downloads.
            admin: true,         // Grant admin-specific permissions.
            header_edit: true,   // Allow editing the header.
            line_edit: true      // Allow editing line items.
        }
    }

    return {
        status: 200,
        result: props  // Return permissions.
    };

    // Check if the user has admin privileges.
    if (checkAdminScope(request.req)) {
        props = {
            action: {
                forward: true,       // Allow forwarding actions.
                assign: true,        // Allow assigning tasks.
                reject: true,        // Allow rejecting items.
                managelock: true,    // Allow managing locks on tasks.
                save: true,          // Allow saving progress.
                savesap: true,       // Allow SAP-related saves.
                comment: true,       // Allow commenting.
                upload: true,        // Allow file uploads.
                download: true,      // Allow file downloads.
                admin: true,         // Grant admin-specific permissions.
                header_edit: true,   // Allow editing the header.
                line_edit: true      // Allow editing line items.
            }
        }

        return {
            status: 200,
            result: props  // Return permissions.
        };
    }

    // Check if the user has manager privileges.
    if (checkManagerScope(request.req)) {
        props = {
            action: {
                forward: true,       // Allow forwarding actions.
                assign: true,        // Allow assigning tasks.
                reject: true,        // Allow rejecting items.
                managelock: false,   // Deny managing locks.
                save: true,          // Allow saving progress.
                savesap: true,       // Allow SAP-related saves.
                comment: true,       // Allow commenting.
                upload: true,        // Allow file uploads.
                download: true,      // Allow file downloads.
                header_edit: true,   // Allow editing the header.
                line_edit: true      // Allow editing line items.
            }
        }

        return {
            status: 200,
            result: props  // Return permissions.
        };
    }

    // Check if the user has operator privileges.
    if (checkOperatorScope(request.req)) {
        props = {
            action: {
                forward: true,       // Allow forwarding actions.
                assign: false,       // Deny assigning tasks.
                reject: true,        // Allow rejecting items.
                managelock: false,   // Deny managing locks.
                save: true,          // Allow saving progress.
                savesap: true,       // Allow SAP-related saves.
                comment: true,       // Allow commenting.
                upload: true,        // Allow file uploads.
                download: true,      // Allow file downloads.
                header_edit: true,   // Allow editing the header.
                line_edit: true      // Allow editing line items.
            }
        }

        return {
            status: 200,
            result: props  // Return permissions.
        };
    }

    // Check if the user has reviewer SCM-specific privileges.
    if (checkReviewer_SCMScope(request.req)) {
        props = {
            action: {
                forward: true,       // Allow forwarding actions.
                assign: false,       // Deny assigning tasks.
                reject: false,       // Deny rejecting items.
                managelock: false,   // Deny managing locks.
                save: true,          // Allow saving progress.
                savesap: false,      // Deny SAP-related saves.
                comment: true,       // Allow commenting.
                upload: false,       // Deny file uploads.
                download: true,      // Allow file downloads.
                header_edit: false,  // Deny editing the header.
                line_edit: true      // Allow editing line items.
            }
        }

        return {
            status: 200,
            result: props  // Return permissions.
        };
    }

    // Check if the user has general reviewer privileges.
    if (checkReviewerScope(request.req)) {
        props = {
            action: {
                forward: true,       // Allow forwarding actions.
                assign: false,       // Deny assigning tasks.
                reject: false,       // Deny rejecting items.
                managelock: false,   // Deny managing locks.
                save: false,         // Deny saving progress.
                savesap: false,      // Deny SAP-related saves.
                comment: true,       // Allow commenting.
                upload: false,       // Deny file uploads.
                download: true,      // Allow file downloads.
                header_edit: false,  // Deny editing the header.
                line_edit: false     // Deny editing line items.
            }
        }

        return {
            status: 200,
            result: props  // Return permissions.
        };
    }

    // Check if the user has auditor privileges.
    if (checkAuditorScope(request.req)) {
        props = {
            action: {
                forward: false,      // Deny forwarding actions.
                assign: false,       // Deny assigning tasks.
                reject: false,       // Deny rejecting items.
                managelock: false,   // Deny managing locks.
                save: false,         // Deny saving progress.
                savesap: false,      // Deny SAP-related saves.
                comment: false,      // Deny commenting.
                upload: false,       // Deny file uploads.
                download: true,      // Allow file downloads.
                header_edit: false,  // Deny editing the header.
                line_edit: false     // Deny editing line items.
            }
        }

        return {
            status: 200,
            result: props  // Return permissions.
        };
    }

    // If no permissions are set (no matching scope) return a 403 Forbidden status as the user lacks read scope.
    return {
        code: '403',
        message: 'Forbidden',
        target: 'Missing permissions',
        status: 403
    };
};
