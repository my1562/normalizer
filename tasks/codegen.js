const fs = require('fs').promises;

const TPL_GEO_INDEX = `
package my1562geocoder

type GeoIndex map[string][]uint32

const GeoIndexResolution = {RESOLUTION}

var GeoIndexData = GeoIndex{
{LIST}
}
`;

const TPL_ADDRESSES = `
package my1562geocoder

type Address struct {
	ID           uint32
	Lat          float64
	Lng          float64
	Number       uint16
	Suffix       string
	Block        string
	StreetID     uint32
    Detail       string
    DetailNumber uint32
	Postcode     uint32
}

type AddressMap map[uint32]Address

var Addresses = AddressMap{
{LIST}
}
`;

const TPL_STREETS = `
package my1562geocoder

type StreetAR struct {
	ID     uint32
	NameUk string
    NameRu string
    TypeUk string
    TypeRu string
}

type StreetsARMap map[uint32]StreetAR

var StreetsAR = StreetsARMap{
{LIST}
}
`;

const escapeString = s => (s ? `"${s}"` : '""');
const escapeNum = n => n || 0;

const addressToGoStruct = address => {
    const data = [
        escapeNum(address.id),
        escapeNum(address.lat),
        escapeNum(address.lng),
        escapeNum(address.number),
        escapeString(address.suffix),
        escapeString(address.block),
        escapeNum(address.streetID),
        escapeString(address.detail),
        escapeNum(address.detailNumber),
        escapeNum(address.postcode)
    ];

    return data.join(', ');
};
const streetArToGoStruct = streetAr => {
    const data = [
        escapeNum(streetAr.id),
        escapeString(streetAr.name_ukr),
        escapeString(streetAr.name_ru),
        escapeString(streetAr.shortTypeUKR),
        escapeString(streetAr.shortTypeRU)
    ];

    return data.join(', ');
};

const generateGeoIndex = async () => {
    const geoIndex = JSON.parse(
        await fs.readFile('./data/geo-index.json', 'utf8')
    );
    const geoindexGo = TPL_GEO_INDEX.replace(
        /{RESOLUTION}/,
        geoIndex.resolution
    ).replace(
        /{LIST}/g,
        Object.entries(geoIndex.index)
            .map(([key, items]) => {
                return `\t"${key}": {${items.join(', ')}},`;
            })
            .join('\n')
    );

    await fs.writeFile('./pkg/geoindex.go', geoindexGo, 'utf8');
};

const generateAddressMap = async () => {
    const index = JSON.parse(
        await fs.readFile('./data/addresses.json', 'utf8')
    );
    const addressesGo = TPL_ADDRESSES.replace(
        /{LIST}/g,
        Object.entries(index)
            .map(([key, address]) => {
                if (
                    address.number < 0 ||
                    address.detailNumber < 0 ||
                    address.id <= 0 ||
                    address.streetID <= 0 ||
                    address.postcode < 0
                ) {
                    console.warn('Illegal address', address);
                    return '';
                }
                return `\t${key}: Address{${addressToGoStruct(address)}},`;
            })
            .join('\n')
    );

    await fs.writeFile('./pkg/addresses.go', addressesGo, 'utf8');
};

const generateStreetsArMap = async () => {
    const { items } = JSON.parse(
        await fs.readFile('./data/streetsAR.json', 'utf8')
    );
    const itemsGo = TPL_STREETS.replace(
        /{LIST}/g,
        items
            .map(item => {
                return `\t${item.id}: StreetAR{${streetArToGoStruct(item)}},`;
            })
            .join('\n')
    );

    await fs.writeFile('./pkg/streetsAR.go', itemsGo, 'utf8');
};

const main = async () => {
    await generateGeoIndex();
    await generateAddressMap();
    await generateStreetsArMap();
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
