const axios = require('axios');
const CONFIG = require('./config');

async function getGasPrices() {
    const res = await axios.get(`https://api.zapper.fi/v1/gas-price?network=ethereum&api_key=${CONFIG.ZAPPER_API_KEY}`);
    const data = res.data;
    return `::GAS PRICES::
🔴 Standard: ${data.standard}
🟡 Fast: ${data.fast}
🟢 Instant: ${data.instant}`
}

module.exports = { getGasPrices }