

/**
 * 
 * @param {String} params 
 * @returns an object of key-value pairs where each value is part of a where condition query
 */
function parseMultipleParamsForDocPack(params) {
    console.log('parseMultipleParamsForDocPack ', params);
    let keys = params.split(',');

    for (i in keys) {
        console.log('keys[i] ', keys[i]);
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
    console.log('keys ', keys);
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

module.exports = {
    parseMultipleParamsForDocPack,
    getDateWithMilliseconds,
    getDateWithMillisecondsWithoutParam,
    formatDateFromString,
    formatDateToString,
    formatDateTimeToString
}