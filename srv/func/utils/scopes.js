/**
 * Check scope for read operation
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkReadScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('readall') || req.authInfo.checkLocalScope('read');
}

/**
 * Check scope for readall operation
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkReadAllData(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('readall');
}

/**
 * Check scope for read operation
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkReadData(req) {
    return req.authInfo.checkLocalScope('read');
}

/**
 * Check admin scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkAdminScope(req) {
    return req.authInfo.checkLocalScope('Admin');
}

/**
 * Check manager scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkManagerScope(req) {
    return req.authInfo.checkLocalScope('readall') && req.authInfo.checkLocalScope('write')
        && req.authInfo.checkLocalScope('process') && req.authInfo.checkLocalScope('assign')
        && req.authInfo.checkLocalScope('forward') && req.authInfo.checkLocalScope('comment')
        && req.authInfo.checkLocalScope('upload') && req.authInfo.checkLocalScope('download')
        && req.authInfo.checkLocalScope('header_edit')
        && req.authInfo.checkLocalScope('line_edit');
}

/**
 * Check operator scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkOperatorScope(req) {
    return req.authInfo.checkLocalScope('read') && req.authInfo.checkLocalScope('write')
        && req.authInfo.checkLocalScope('process') && req.authInfo.checkLocalScope('forward')
        && req.authInfo.checkLocalScope('comment') && req.authInfo.checkLocalScope('upload')
        && req.authInfo.checkLocalScope('download') && req.authInfo.checkLocalScope('header_edit') && req.authInfo.checkLocalScope('line_edit');
}

/**
 * Check reviewer scm scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkReviewer_SCMScope(req) {
    return req.authInfo.checkLocalScope('read') && req.authInfo.checkLocalScope('write')
        && req.authInfo.checkLocalScope('process') && req.authInfo.checkLocalScope('forward')
        && req.authInfo.checkLocalScope('comment') && req.authInfo.checkLocalScope('upload')
        && req.authInfo.checkLocalScope('download') && req.authInfo.checkLocalScope('line_edit');
}

/**
 * Check reviewer scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkReviewerScope(req) {
    return req.authInfo.checkLocalScope('read') && req.authInfo.checkLocalScope('forward')
        && req.authInfo.checkLocalScope('comment') && req.authInfo.checkLocalScope('upload')
        && req.authInfo.checkLocalScope('download');
}

/**
 * Check auditor scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkAuditorScope(req) {
    return req.authInfo.checkLocalScope('readall') && req.authInfo.checkLocalScope('download');
}

/**
 * Check assign scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkAssignScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('assign');
}

/**
 * Check forward scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkForwardScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('assign');
}


/**
 * Check write scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkWriteScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('write');
}

/**
 * Check save scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkSaveScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('write');
}


/**
 * Check submit scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkSubmitScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('write');
}

/**
 * Check comment scope
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkCommentScope(req) {
    return req.authInfo.checkLocalScope('Admin') || req.authInfo.checkLocalScope('comment');
}

module.exports = {
    checkReadScope,
    checkReadAllData,
    checkReadData,
    checkAdminScope,
    checkManagerScope,
    checkOperatorScope,
    checkReviewer_SCMScope,
    checkReviewerScope,
    checkAuditorScope,
    checkAssignScope,
    checkForwardScope,
    checkWriteScope,
    checkSaveScope,
    checkSubmitScope,
    checkCommentScope
}