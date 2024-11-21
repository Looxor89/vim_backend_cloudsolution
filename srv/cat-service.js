"use strict";

/**
 * Perform a request by executing the logic defined in an external file specified by `path`.
 * 
 * This function starts a transaction using the service (`srv`) and passes the request and transaction
 * to the external function (usually for handling a specific type of business logic related to the request).
 * 
 * @param {object} srv - Service object which provides the context for handling requests and interacting with the underlying data model.
 * @param {cds.Request} request - An incoming request object, encapsulating details about the current request being handled.
 * @param {String} path - The path to the external JavaScript file that contains the logic to be executed for the request.
 * 
 * @returns {Promise<void>} - The function doesn't explicitly return anything but uses `request.reply` or `request.error` to respond to the caller.
 */
async function performRequest(srv, request, path) {
    try {
        // Start a transaction to execute the external request handler function defined in the file at 'path'.
        const result = await srv.transaction(async tx => {
            console.log('REQUIRE: ', path);
            return require(path)(request, tx);  // Load and call the function from the specified file.
        });

        console.log("RESULT: ", result);  // No need to 'await' here since `result` is not a Promise.

        // If the result contains an error status, return an error response to the client.
        if ([500, 403, 422].includes(result.status)) {
            return request.error(result);  // Return an error response to the client.
        }

        // If no errors, return the successful result to the client.
        return request.reply(result);

    } catch (error) {
        // Log the error and reject the request with the caught error for context.
        console.error('Error during request processing:', error);
        return request.reject(error);  // Pass the error object for better client feedback.
    }
}


/**
 * Perform a submit request by executing the logic defined in an external file specified by `path`.
 * 
 * This function starts a transaction using the service (`srv`) and passes the request and transaction
 * to the external function (usually for handling a specific type of business logic related to the request).
 * 
 * @param {object} srv - Service object which provides the context for handling requests and interacting with the underlying data model.
 * @param {cds.Request} request - An incoming request object, encapsulating details about the current request being handled.
 * @param {String} path - The path to the external JavaScript file that contains the logic to be executed for the request.
 * 
 * @returns {Promise<void>} - The function doesn't explicitly return anything but uses `request.reply` or `request.error` to respond to the caller.
 */
async function performSubmitRequest(srv, request, path) {
    try {
        // Start a transaction, attempt to execute the logic in the './func/save' file first
        var result = await srv.transaction(async tx => {
            console.log('REQUIRE: ', './func/save');
            return require('./func/save')(request, tx);  // Load and call the function from './func/save'.
        });

        // If result indicates an error (status 500, 403, or 422), return an error response to the client.
        if ([500, 403, 422].includes(result.status)) {
            return request.error(result);
        }

        // If the previous transaction did not return an error, proceed with the external file from `path`.
        result = await srv.transaction(async tx => {
            console.log('REQUIRE: ', path);
            return require(path)(request, tx);  // Load and call the function from the specified file in `path`.
        });

        // Check if the result has an error status and respond accordingly
        if ([500, 403, 422].includes(result.status)) {
            return request.error(result);  // Return the error result to the client.
        }

        // If no errors, send a success response back to the client
        return request.reply(result);

    } catch (error) {
        // Log the error and reject the request with a meaningful message.
        console.error('Error during submit request:', error);
        return request.reject(error);  // Pass the error object to provide more context.
    }
}



module.exports = function (srv) {
    /**
    * Function for handling requests related to invoices.
    * 
    * This function listens for events on the `extended` action and processes requests related to invoice elaboration.
    * The request will be forwarded to the 'extended' function located in the './func/extended' file.
    * 
    * The external function (in './func/extended') fetches details about invoice elaboration, such as:
    * - The user who performed specific actions on the invoice.
    * - Task assignments (e.g., who has been assigned to the task).
    * - Other metadata strictly related to the invoice processing lifecycle.
    * 
    * @param {object} srv - Service object that manages request listeners and interactions with the data model.
    */
    srv.on('extended', '*', async request => {
        await performRequest(srv, request, './func/extended');
    });

    /**
     * Function for handling user capabilities requests based on role scopes.
     * 
     * This function listens for the 'capabilities' event, which is used to determine and retrieve all actions
     * that a user can perform based on their role and permission scopes. The logic for determining capabilities
     * is encapsulated in the './func/capabilities' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('capabilities', '*', async request => {
        await performRequest(srv, request, './func/capabilities');
    });

    /**
     * Function for handling users requests based on role scopes.
     * 
     * This function listens for the 'users' event, which is used to determine and retrieve all users from respective
     * table. The logic for determining users is encapsulated in the './func/users' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('users', '*', async request => {
        await performRequest(srv, request, './func/users');
    });

    /**
     * Function for handling user assign requests based on role scopes.
     * 
     * This function listens for the 'assign' event, which is used to assign user to an invoice.
     * The logic is encapsulated in the './func/assign' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('assign', '*', async request => {
        await performRequest(srv, request, './func/assign');
    });

    /**
     * Function for handling user forward requests based on role scopes.
     * 
     * This function listens for the 'forward' event, which is used to forward user to an invoice.
     * The logic is encapsulated in the './func/forward' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('forward', '*', async request => {
        await performRequest(srv, request, './func/forward');
    });

    /**
     * Function for handling unlock requests based on role scopes.
     * 
     * This function listens for the 'unlock' event, which is used to unlock an invoice.
     * The logic is encapsulated in the './func/unlock' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('unlock', '*', async request => {
        await performRequest(srv, request, './func/unlock');
    });

    /**
     * Function for handling lock requests based on role scopes.
     * 
     * This function listens for the 'lock' event, which is used to lock an invoice.
     * The logic is encapsulated in the './func/lock' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('lock', '*', async request => {
        await performRequest(srv, request, './func/lock');
    });

    /**
     * Function for handling reject requests based on role scopes.
     * 
     * This function listens for the 'reject' event, which is used to reject an invoice.
     * The logic is encapsulated in the './func/reject' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('reject', '*', async request => {
        await performRequest(srv, request, './func/reject');
    });

    /**
     * Function for handling save requests based on role scopes.
     * 
     * This function listens for the 'save' event, which is used to save an invoice.
     * The logic is encapsulated in the './func/save' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('save', '*', async request => {
        await performRequest(srv, request, './func/save');
    });

    /**
     * Function for handling massive submit requests based on role scopes.
     * 
     * This function listens for the 'massiveSubmit' event, which is used to submit an array of invoices.
     * The logic is encapsulated in the './func/massiveSubmit' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('massiveSubmit', '*', async request => {
        await performRequest(srv, request, './func/massiveSubmit');
    });

    /**
     * Function for handling submit requests based on role scopes.
     * 
     * This function listens for the 'submit' event, which is used to submit an invoice.
     * The logic is encapsulated in the './func/submit' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('submit', '*', async request => {
        await performSubmitRequest(srv, request, './func/submit');
    });

    /**
     * Function for handling submit requests based on role scopes.
     * 
     * This function listens for the 'submit' event, which is used to submit an invoice.
     * The logic is encapsulated in the './func/submit' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('addAttachment', '*', async request => {
        await performRequest(srv, request, './func/addAttachment');
    });

    /**
     * Function for handling lockStatus requests based on role scopes.
     * 
     * This function listens for the 'lockStatus' event, which is used to get lock status of an invoice.
     * The logic is encapsulated in the './func/lockStatus' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('lockStatus', '*', async request => {
        await performRequest(srv, request, './func/lockStatus');
    });

    /**
     * Function for handling lockStatus requests based on role scopes.
     * 
     * This function listens for the 'lockStatus' event, which is used to get lock status of an invoice.
     * The logic is encapsulated in the './func/lockStatus' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('notes', '*', async request => {
        await performRequest(srv, request, './func/notes');
    });

    /**
     * Function for handling list requests based on role scopes.
     * 
     * This function listens for the 'list' event, which is used to get document list of an invoice.
     * The logic is encapsulated in the './func/list' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('list', '*', async request => {
        await performRequest(srv, request, './func/list');
    });

    /**
     * Function for handling currency requests based on role scopes.
     * 
     * This function listens for the 'currency' event, which is used to get all possible currency.
     * The logic is encapsulated in the './func/currency' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('currency', '*', async request => {
        await performRequest(srv, request, './func/currency');
    });

    /**
     * Function for handling getInvoice requests based on role scopes.
     * 
     * This function listens for the 'getInvoice' event, which is used to get Invoice details (header and body).
     * The logic is encapsulated in the './func/getInvoice' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('getInvoice', '*', async request => {
        await performRequest(srv, request, './func/getInvoice');
    });

    /**
     * Function for handling add notes requests based on role scopes.
     * 
     * This function listens for the 'addNotes' event, which is used to adding notes for invoices.
     * The logic is encapsulated in the './func/addNotes' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    srv.on('addNotes', '*', async request => {
        await performRequest(srv, request, './func/addNotes');
    });

    /**
     * Function for handling add doc requests based on role scopes.
     * 
     * This function listens for the 'addDoc' event, which is used to adding documents for invoices.
     * The logic is encapsulated in the './func/addNotes' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    // srv.on('addDoc', '*', async request => {
    //     await performRequest(srv, request, './func/addDoc');
    // });

    /**
     * Function for handling get metadata requests based on role scopes.
     * 
     * This function listens for the 'getMetadata' event, which is used to get metadata invoices.
     * The logic is encapsulated in the './func/getMetadata' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    // srv.on('getMetadata', '*', async request => {
    //     await performRequest(srv, request, './func/getMetadata');
    // });

    /**
     * Function for handling remove job requests based on role scopes.
     * 
     * This function listens for the 'removeJob' event, which is used to change invoices document category.
     * The logic is encapsulated in the './func/removeJob' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    // srv.on('removeJob', '*', async request => {
    //     await performRequest(srv, request, './func/removeJob');
    // });

    /**
     * Function for handling set main job requests based on role scopes.
     * 
     * This function listens for the 'setMainJob' event, which is used to set main invoice document.
     * The logic is encapsulated in the './func/setMainJob' file.
     * 
     * @param {object} srv - Service object that manages request listeners and interactions with the data model.
     */
    // srv.on('setMainJob', '*', async request => {
    //     await performRequest(srv, request, './func/setMainJob');
    // });
};