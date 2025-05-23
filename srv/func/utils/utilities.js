

/**
 * 
 * @param {String} params 
 * @returns an object of key-value pairs where each value is part of a where condition query
 */
function parseMultipleParamsForDocPack(params) {
    let keys = params.split(',');

    for (i in keys) {
        // keys[i] = ${keys[i]};
        if (keys[i].includes(' ')) {
            keys[i] = `'%${keys[i].split(' ').join('%')}%'`;
        } else if (keys[i].includes('*')) {
            keys[i] = `'%${keys[i].split('*').join('%')}%'`;
        } else if (keys[i] === 'true') {
            keys[i] = `'${keys[i]}'`;
        } else if (keys[i] === 'POINV' || keys[i] === 'NONPOINV' || keys[i] === 'POCREDM' || keys[i] === 'NONPOCREDM') {
            keys[i] = `'${keys[i]}'`;
        } else {
            keys[i] = `'%${keys[i]}%'`;
        }
    }
    return keys;
};

/**
 * 
 * @param {String} sDate 
 * @returns a string containing date in format /Date(1727733600000)/
 */
function getDateWithMilliseconds(sDate) {
    return sDate ? `/Date(${(new Date(sDate).getTime())})/` : null;
};

/**
 * 
 * @returns a string containing date in format /Date(1727733600000)/
 */
function getDateWithMillisecondsWithoutParam() {
    return `/Date(${(new Date().getTime())})/`;
};

/**
 * 
 * @param {String} sDate 
 * @returns Date
 */
function formatDateFromString(sDate) {
    let aDate = sDate.split("-"),
    sYear = aDate[0], sMonth = aDate[1] - 1, sDay = aDate[2];
    return new Date(sYear, sMonth, sDay);
}

/**
 * 
 * @param {Date} dDate 
 * @returns Date in yyyy-MM-dd format
 */
function formatDateToString(dDate) {
    let sYear = dDate.getFullYear(),
    sMonth = dDate.getMonth() + 1,
    sDay = dDate.getDate();
    return sYear+"-"+sMonth+"-"+sDay;
}

/**
 * Format DateTime like "2025-01-03T12:22:31.276259Z" to "2025-01-03 12:22:31"
 * @param {Date} sDateTime 
 * @returns Date in yyyy-MM-dd HH:mm:ss format
 */
function formatDateTimeToString(sDateTime) {
    if(!sDateTime) return null;
    let aDateTime = sDateTime.split("T");
    let sDate = aDateTime[0],
    sUnformattedTime = aDateTime[1];
    let aTime = sUnformattedTime.split("."),
    sTime = aTime[0];
    return sDate+" "+sTime;
}

/**
 * Format DateTime like "/Date(1243567890)/" to "2025-01-03 12:22:31"
 * @param {Date} sDateTime 
 * @returns Date in yyyy-MM-dd HH:mm:ss format
 */
function formatDateFromFunctionToString(sDateTime) {
    // Regular expression to extract milliseconds from CreationDate
    const dateRegex = /\/Date\((\d+)\)\//;
    const match = dateRegex.exec(sDateTime);
    if (match) {
        let dDate = new Date(parseInt(match[1], 10)); // Update with milliseconds as a number
        let sYear = dDate.getFullYear(),
        sMonth = dDate.getMonth() + 1,
        sDay = dDate.getDate();
        return sYear+"-"+sMonth+"-"+sDay;
        
    }
    return sDate;
}

/**
 * Format Time like "PT08H28M22S" to "08:28:22"
 * @param {Time} sTime 
 * @returns TimeHH:mm:ss format
 */
function formatTimeToString(sTime) {
    const regex = /^PT(\d{2})H(\d{2})M(\d{2})S$/;
    const match = regex.exec(sTime);

    if (match) {
        const hours = match[1];
        const minutes = match[2];
        const seconds = match[3];
        return `${hours}:${minutes}:${seconds}`;
    } 
    return sTime;
}

module.exports = {
    parseMultipleParamsForDocPack,
    getDateWithMilliseconds,
    getDateWithMillisecondsWithoutParam,
    formatDateFromString,
    formatDateToString,
    formatDateFromFunctionToString,
    formatDateTimeToString,
    formatTimeToString
}