const _ = require('lodash');
const fs = require('fs').promises;
const chart = require('ascii-horizontal-barchart');
const arraystat = require('../lib/arraystat');
const { reduceAddresses } = require('../lib/addresses');

const latLongToKey = (lat, lng) => {
    const resolution = 200;

    const iLat = ((lat + 90) * resolution) | 0;
    const iLng = ((lng + 180) * resolution) | 0;
    return iLat + '.' + iLng;
};

const arAddressToAddress = arAddress => {
    return {
        lat: arAddress.lati,
        lng: arAddress.longt,
        number: arAddress.number,
        suffix: arAddress.suffix,
        block: arAddress.block,
        streetID: arAddress.streetid,
        detail: arAddress.detail_ua,
        detailNumber: arAddress.detailNumber,
        postcode: arAddress.postcode
    };
};

const main = async () => {
    console.time('reduce');
    const index = await reduceAddresses((acc, address) => {
        const key = latLongToKey(address.lati, address.longt);
        const bucket = acc[key] ? acc[key] : (acc[key] = []);
        bucket.push(address.id);
        return acc;
    }, {});
    console.timeEnd('reduce');

    const lengths = _(index)
        .values()
        .map('length')
        .sortBy()
        .value();

    const stat = arraystat(lengths);
    console.log(stat);

    console.log(
        chart(
            _(stat.histogram)
                .map(_ => [`${_.min.toFixed(0)}-${_.max.toFixed(0)}`, _.nb])
                .fromPairs()
                .value(),
            true
        )
    );

    await fs.writeFile('./data/geo-index.json', JSON.stringify(index), 'utf8');
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
