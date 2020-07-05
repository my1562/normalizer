const _ = require('lodash');
const fs = require('fs').promises;
const client = require('../lib/client');
const sleep = require('sleep-promise');
const yargs = require('yargs');

const OMIT_FIELDS = ['Street', 'AddressStatus', 'local_X', 'local_Y'];
const omitMeaninglessFields = address =>
    _(address)
        .omit(OMIT_FIELDS)
        .value();

const main = async () => {
    const { continue: doContinue } = yargs.argv;

    const streets = await client.getARStreets();
    let i = 0;
    for (const street of streets.items) {
        const percentage = (i++ / streets.items.length) * 100;
        const fileName = `./data/addresses/${street.id}.json`;

        if (doContinue) {
            try {
                const stat = await fs.stat(fileName);
                if (stat.isFile) {
                    console.log(
                        `Skip: ${street.shortTypeUKR} ${street.name_ukr}`
                    );
                    continue;
                }
            } catch (e) {
                if (e.code !== 'ENOENT') {
                    throw e;
                }
            }
        }

        const dirtyAddresses = await client.getAddressesByStreetId(street.id);
        const addresses = dirtyAddresses.map(omitMeaninglessFields);
        await fs.writeFile(
            fileName,
            JSON.stringify(addresses, false, 1),
            'utf8'
        );
        console.log(
            `${percentage.toFixed(2)}% done. Processed ${street.shortTypeUKR} ${
                street.name_ukr
            }`
        );
        await sleep(1000);
    }
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
