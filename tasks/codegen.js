const fs = require('fs').promises;

const TPL_GEO_INDEX = `
package my1562geocoder

type GeoIndex map[string][]uint32

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

const escapeString = s => (s ? `"${s}"` : '""');
const escapeNum = n => n || 0;

const addressToGoStruct = address => {
    const data = [
        ['ID', escapeNum(address.id)],
        ['Lat', escapeNum(address.lat)],
        ['Lng', escapeNum(address.lng)],
        ['Number', escapeNum(address.number)],
        ['Suffix', escapeString(address.suffix)],
        ['Block', escapeString(address.block)],
        ['StreetID', escapeNum(address.streetID)],
        ['Detail', escapeString(address.detail)],
        ['DetailNumber', escapeNum(address.detailNumber)],
        ['Postcode', escapeNum(address.postcode)]
    ];

    return data.map(([key, value]) => `\t\t${key}: ${value},`).join('\n');
};

const generateGeoIndex = async () => {
    const index = JSON.parse(
        await fs.readFile('./data/geo-index.json', 'utf8')
    );
    const geoindexGo = TPL_GEO_INDEX.replace(
        /{LIST}/g,
        Object.entries(index)
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
                return `\t${key}: Address{\n${addressToGoStruct(
                    address
                )}\n\t},`;
            })
            .join('\n')
    );

    await fs.writeFile('./pkg/addresses.go', addressesGo, 'utf8');
};

const main = async () => {
    await generateGeoIndex();
    await generateAddressMap();
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
