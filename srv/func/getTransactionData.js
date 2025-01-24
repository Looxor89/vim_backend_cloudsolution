
"use strict";

module.exports = async (request, tx) => {
    return { status: 200, result: ['Invoice','Credit memo','Subsequent debit','Subsequent credit'], message: 'Executed' };
};