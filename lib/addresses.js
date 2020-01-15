const fs = require('fs').promises;
const globby = require('globby');

exports.reduceAddresses = async (cb, acc) => {
    const files = await globby('data/addresses/*.json');
    for (const file of files) {
        const addresses = JSON.parse(await fs.readFile(file, 'utf8'));
        acc = addresses.reduce(cb, acc);
    }
    return acc;
};
