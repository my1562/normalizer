const _ = require('lodash');
const { expect } = require('chai');
const client = require('../lib/client');
const fs = require('fs').promises;

const CYR_RANGE =
    'аАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяЯґҐєЄїЇіІ';
const RE_MEANINGLESS = new RegExp(`[^${CYR_RANGE}a-z0-9\\s]+`, 'gi');

const RE_APOSTROPHE = /['"`ʼ]/g;

/*

"{
  "Children": [],
  "id": 4474,
  "Valid": 1,
  "StreetValid": {
    "id": 1,
    "name": "Дійсний"
  },
  "isValid": "YES",
  "TypeId": 14,
  "StreetType": {
    "id": 14,
    "t_ru": "улица",
    "t_s_ukr": "вул.",
    "t_s_ru": "ул.",
    "t_ukr": "вулиця"
  },
  "typeRU": "улица",
  "typeUKR": "вулиця",
  "shortTypeRU": "ул.",
  "shortTypeUKR": "вул.",
  "name_ru": "Ярославская",
  "name_ukr": "Ярославська",
  "OldStreetId": 2626,
  "old_street_id": 2626,
  "regDate": "09.02.2018 11:17:33",
  "leftTopX": 14890.872,
  "leftTopY": 13286.811,
  "rightBottomX": 14773.721000000001,
  "rightBottomY": 12528.082,
  "leftTopLongitude": 36.220143413799995,
  "leftTopLatitude": 49.992046099300005,
  "rightBottomLongitude": 36.2185408429,
  "rightBottomLatitude": 49.985221746300006,
  "parent_ids": null,
  "parent_ukr": null,
  "parent_rus": null,
  "childs_ids": null,
  "childs_ukr": null,
  "childs_rus": null
}"

*/

const normalizeString = string => {
    const tokens = string
        .replace(RE_APOSTROPHE, '')
        .replace(RE_MEANINGLESS, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .split(' ');
    tokens.sort();
    return tokens.join(' ');
};

const replaceShortType = shortType => {
    const replacement = {
        'просп.': 'пр.',
        'м-н': 'пл.',
        'узв.': 'сп.',
        'відс.': 'пос.'
    }[shortType];
    return replacement || shortType;
};

const add1562LikeNameToARStreet = arStreet => {
    expect(arStreet.shortTypeUKR).to.be.a('string');
    expect(arStreet.name_ukr).to.be.a('string');
    const shortType = replaceShortType(arStreet.StreetType.t_s_ukr);
    const nameLike1562 = `${shortType} ${arStreet.name_ukr}`;
    arStreet.nameLike1562 = nameLike1562;
};

const addDecommunizedNameToARStreet = (arStreets, arStreet) => {
    if (arStreet.isValid !== 'NO') {
        return;
    }

    if (!arStreet.Children.length) {
        return;
    }
    const newStreetID = arStreet.Children[0].id;
    const newStreet = arStreets.byId[newStreetID];

    if (newStreet.decommunizedName) {
        console.warn(
            `Double decommunization: ${arStreet.name_ukr} -> ${newStreet.decommunizedName}`
        );
    }

    newStreet.decommunizedName = `${newStreet.nameLike1562} (${arStreet.name_ukr})`;
};

const strictEqualityMatch = (streetsAR, streets1562) => {
    const name1562IndexAR = _(streetsAR.items)
        .keyBy(streetAR => normalizeString(streetAR.nameLike1562))
        .value();
    const pairs = streets1562.items.map(street1562 => ({
        street1562,
        streetAR: name1562IndexAR[normalizeString(street1562.name)]
    }));

    const matched = pairs.filter(({ streetAR }) => streetAR);
    const notMatched = pairs
        .filter(({ streetAR }) => !streetAR)
        .map(({ street1562 }) => street1562);
    return {
        matched,
        notMatched
    };
};
const decommunizedMatch = (streetsAR, streets1562) => {
    const decommunizedNameIndexAR = _(streetsAR.items)
        .filter('decommunizedName')
        .keyBy(streetAR => normalizeString(streetAR.decommunizedName))
        .value();

    const pairs = streets1562.map(street1562 => ({
        street1562,
        streetAR: decommunizedNameIndexAR[normalizeString(street1562.name)]
    }));

    const matched = pairs.filter(({ streetAR }) => streetAR);
    const notMatched = pairs
        .filter(({ streetAR }) => !streetAR)
        .map(({ street1562 }) => street1562);
    return {
        matched,
        notMatched
    };
};

const getManualMatches = async () =>
    JSON.parse(await fs.readFile('./data/manual.json', 'utf8'));

const manualMatch = (streetsAR, manualMatches, streets1562) => {
    const index = _(manualMatches)
        .keyBy('id')
        .value();

    const pairs = streets1562.map(street1562 => {
        const match = index[street1562.id];
        const arStreetID = match ? match.arStreetID : null;
        return {
            street1562,
            streetAR: arStreetID ? streetsAR.byId[arStreetID] : null
        };
    });
    const matched = pairs.filter(({ streetAR }) => streetAR);
    const notMatched = pairs
        .filter(({ streetAR }) => !streetAR)
        .map(({ street1562 }) => street1562);
    return {
        matched,
        notMatched
    };
};

const mergeMatches = match => {
    const _1562ToAR = {};
    const arTo1562 = {};

    match.forEach(({ street1562, streetAR }) => {
        _1562ToAR[street1562.id] = streetAR.id;
        arTo1562[streetAR.id] = street1562.id;
    });

    return { '1562ToAR': _1562ToAR, arTo1562 };
};

const analyzeDuplications = matches => {
    const groups = _(matches)
        .groupBy('streetAR.id')
        .filter(group => group.length > 1)
        .value();

    if (!groups.length) {
        return;
    }
    console.log(`Duplications (${groups.length}):`);
    groups.forEach((group, i) => {
        console.log(`\n#${i + 1}`);
        group.forEach(({ street1562, streetAR }) => {
            console.log(
                `${street1562.name}(ID:${street1562.id}) = ${streetAR.shortTypeUKR} ${streetAR.name_ukr}(ID:${streetAR.id})`
            );
        });
    });
};

const main = async () => {
    const manualMatches = await getManualMatches();

    console.time('client.get1562Streets');
    const streets1562 = await client.get1562Streets();
    await fs.writeFile(
        './data/streets1562.json',
        JSON.stringify(streets1562.byId, false, 2),
        'utf8'
    );
    console.timeEnd('client.get1562Streets');

    console.time('client.getARStreets');
    const streetsAR = await client.getARStreets();
    await fs.writeFile(
        './data/streetsAR.json',
        JSON.stringify(streetsAR.byId, false, 2),
        'utf8'
    );
    streetsAR.items.forEach(add1562LikeNameToARStreet);
    streetsAR.items.forEach(
        addDecommunizedNameToARStreet.bind(null, streetsAR)
    );
    console.timeEnd('client.getARStreets');

    console.time('strictEqualityMatch');
    const strictMatchResult = strictEqualityMatch(streetsAR, streets1562);
    console.timeEnd('strictEqualityMatch');

    console.time('decommunizedMatch');
    const decommunizedMatchResult = decommunizedMatch(
        streetsAR,
        strictMatchResult.notMatched
    );
    console.timeEnd('decommunizedMatch');

    const manualMatchResults = manualMatch(
        streetsAR,
        manualMatches,
        decommunizedMatchResult.notMatched
    );

    console.log('Unmatched:', manualMatchResults.notMatched.length);
    const unmatchedJson = JSON.stringify(
        manualMatchResults.notMatched.map(item => {
            return {
                ...item,
                arStreetID: null
            };
        }),
        false,
        2
    );
    await fs.writeFile('./data/unmatched.json', unmatchedJson, 'utf8');

    analyzeDuplications([
        ...strictMatchResult.matched,
        ...decommunizedMatchResult.matched,
        ...manualMatchResults.matched
    ]);

    const result = mergeMatches([
        ...strictMatchResult.matched,
        ...decommunizedMatchResult.matched,
        ...manualMatchResults.matched
    ]);
    await fs.writeFile(
        './data/mapping.json',
        JSON.stringify(result, false, 1),
        'utf8'
    );
};

main().catch(e => {
    console.error(e.stack);
    process.exit(1);
});
