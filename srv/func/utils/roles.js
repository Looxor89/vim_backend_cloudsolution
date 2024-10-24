
/**
 * Check role for read operation
 * @param {*} authInfo 
 * @returns boolean value, true if in scope false otherwise
 */
function checkReadRole (user) {
    return user.is('admin') || user.is('ZRT_AP_Manager') || user.is('ZRT_AP_Operator') || user.is('ZRT_AP_Reviewer') || user.is('ZRT_AP_Reviewer_SCM') || user.is('ZRT_AP_Auditor');
}

module.exports = {
    checkReadRole
}