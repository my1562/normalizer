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

const TPL_STREETS_1562 = `
package my1562geocoder

type Street1562 struct {
	ID   uint32
	Name string
}

type Streets1562Map map[uint32]Street1562

var Streets1562 = Streets1562Map{
{LIST}
}
`;

const TPL_MAPPING = `
package my1562geocoder

type IDToIDMap map[uint32]uint32

var StreetsARto1562 = IDToIDMap{
    {LIST0}
}
var Streets1562ToAr = IDToIDMap{
    {LIST1}
}
            

`;

const escapeString = s => (s ? `"${s.replace(/"/g, '\\"')}"` : '""');
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

const street1562ToGoStruct = streetAr => {
    const data = [escapeNum(streetAr.id), escapeString(streetAr.name)];

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

const generateStreets1562Map = async () => {
    const { items } = JSON.parse(
        await fs.readFile('./data/streets1562.json', 'utf8')
    );
    const itemsGo = TPL_STREETS_1562.replace(
        /{LIST}/g,
        items
            .map(item => {
                return `\t${item.id}: StreetAR{${street1562ToGoStruct(item)}},`;
            })
            .join('\n')
    );

    await fs.writeFile('./pkg/streets1562.go', itemsGo, 'utf8');
};

const generateIdToIdMaps = async () => {
    const mappings = JSON.parse(
        await fs.readFile('./data/mapping.json', 'utf8')
    );

    function mapper([key, value]) {
        return `\t${key}: ${value},`;
    }

    const list0 = Object.entries(mappings['1562ToAR'])
        .map(mapper)
        .join('\n');
    const list1 = Object.entries(mappings['arTo1562'])
        .map(mapper)
        .join('\n');

    const goSource = TPL_MAPPING.replace(/{LIST0}/g, list0).replace(
        /{LIST1}/g,
        list1
    );

    await fs.writeFile('./pkg/mapping.go', goSource, 'utf8');
};

const main = async () => {
    await generateGeoIndex();
    await generateAddressMap();
    await generateStreetsArMap();
    await generateIdToIdMaps();
    await generateStreets1562Map();
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
