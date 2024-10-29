

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

module.exports = {
    parseMultipleParamsForDocPack,
    getDateWithMilliseconds,
    getDateWithMillisecondsWithoutParam
}