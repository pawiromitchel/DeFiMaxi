const axios = require('axios');
const CONFIG = require('./config');

async function getGasPrices(network = '') {
    switch (network) {
        case "eth":
        case "ethereum":
            network = "ethereum"
            break;
        case "matic":
        case "polygon":
            network = "polygon"
            break;
        case "bnb":
        case "binance":
            network = "binance-smart-chain"
            break;
        default:
            network = "ethereum"
            break;
    }

    const res = await axios.get(`https://api.zapper.fi/v1/gas-price?network=${network}&api_key=${CONFIG.ZAPPER_API_KEY}`);
    const data = res.data;
    return `::GAS PRICES | ${network.toUpperCase()}::
🟢 Instant: ${data.instant}
🟡 Fast: ${data.fast}
🔴 Standard: ${data.standard}
`
}

async function getHealthFactor(protocol, chain) {

}

module.exports = { getGasPrices }