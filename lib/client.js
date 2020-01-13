const _ = require('lodash');
const qs = require('querystring');
const axios = require('axios');
const {
    URL_AR_ADDRESSES_BY_STREET_ID,
    URL_AR_STREETS,
    URL_1562_STREETS
} = require('./constants');

const indexById = items => {
    return {
        items,
        byId: _(items)
            .keyBy('id')
            .value()
    };
};

exports.getARStreets = async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const { data: streets } = await axios.get(URL_AR_STREETS);
    return indexById(streets);
};

exports.get1562Streets = async () => {
    const { data: text } = await axios.get(URL_1562_STREETS);

    return indexById(
        text
            .trim()
            .split('\n')
            .map(line => {
                const parts = line.split('|');
                return {
                    id: parseInt(parts[0].trim(), 10),
                    name: parts[1].trim().replace(/\s+/g, ' ')
                };
            })
    );
};

exports.getAddressesByStreetId = async streetId => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const { data: addresses } = await axios.get(
        `${URL_AR_ADDRESSES_BY_STREET_ID}?${qs.stringify({
            streetId,
            login: ''
        })}`
    );
    return addresses;
};
