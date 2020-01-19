const _ = require('lodash');
const fs = require('fs').promises;
const chart = require('ascii-horizontal-barchart');
const arraystat = require('../lib/arraystat');
const { reduceAddresses } = require('../lib/addresses');
const GEO_INDEX_RESOLUTION = 200;

const latLongToKey = (lat, lng) => {
    const iLat = ((lat + 90) * GEO_INDEX_RESOLUTION) | 0;
    const iLng = ((lng + 180) * GEO_INDEX_RESOLUTION) | 0;
    return iLat + '.' + iLng;
};

const arAddressToAddress = arAddress => {
    return {
        id: arAddress.id,
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
    const { index, shortAddresses } = await reduceAddresses(
        (acc, address) => {
            const { index, shortAddresses } = acc;
            const key = latLongToKey(address.lati, address.longt);
            const bucket = index[key] ? index[key] : (index[key] = []);
            bucket.push(address.id);
            shortAddresses[address.id] = arAddressToAddress(address);
            return acc;
        },
        { index: {}, shortAddresses: {} }
    );
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

    const geoIndex = {
        resolution: GEO_INDEX_RESOLUTION,
        index
    };

    await fs.writeFile(
        './data/geo-index.json',
        JSON.stringify(geoIndex),
        'utf8'
    );
    await fs.writeFile(
        './data/addresses.json',
        JSON.stringify(shortAddresses),
        'utf8'
    );
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
