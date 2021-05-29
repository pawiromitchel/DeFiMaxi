const axios = require('axios');
const CONFIG = require('./config');
const ZAPPER_ENDPOINT = "https://api.zapper.fi/v1/";

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
        case "bsc":
        case "binance":
            network = "binance-smart-chain"
            break;
        default:
            network = "ethereum"
            break;
    }

    const res = await axios.get(`${ZAPPER_ENDPOINT}gas-price?network=${network}&api_key=${CONFIG.ZAPPER_API_KEY}`);
    const data = res.data;
    return data;
}

async function getHealthFactor(protocol, network, address) {
    let text = `::HEALTH FACTOR::\n`;
    if(protocol === "aave" && network === "polygon") {
        protocol = "aave-v2";
        const res = await axios.get(`${ZAPPER_ENDPOINT}protocols/${protocol}/balances?addresses%5B%5D=${address}&network=${network}&api_key=${CONFIG.ZAPPER_API_KEY}`);
        const data = res.data;
        const health = (Object.values(data)[0].products[0].meta[0].value).toFixed(2);
        text += `${health > 1 ? '🟢': '🔴'} ${protocol.toUpperCase()} on ${network.toUpperCase()}: ${health}`
    } else {
        return 'Sorry, @pawiromitchel did not teach me that yet';
    }
    
    return text;
}

module.exports = { getGasPrices, getHealthFactor }