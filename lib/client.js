const _ = require('lodash');
const axios = require('axios');
const { URL_AR_STREETS, URL_1562_STREETS } = require('./constants');

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
