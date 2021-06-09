const axios = require('axios');
const CONFIG = require('./config');
const ZAPPER_ENDPOINT = "https://api.zapper.fi/v1/";

async function getGasPrices(network) {
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
            network = false;
            break;
    }

    if (network) {
        const res = await axios.get(`${ZAPPER_ENDPOINT}gas-price?network=${network}&api_key=${CONFIG.ZAPPER_API_KEY}`);
        const data = res.data;
        return data;
    } else {
        return false;
    }
}

async function getHealthFactor(address) {
    let text = `::HEALTH FACTOR::\n`;

    // Get AAVE on Polygon Health status
    const aaveData = await getProtocolInfo(address, "aave-v2", "polygon");
    let aavePolygonHealth = (Object.values(aaveData)[0].products[0].meta[0].value).toFixed(2);
    if (aavePolygonHealth) text += `${aavePolygonHealth > 1.25 ? '🟢' : '🔴'} ${"aave-v2".toUpperCase()} on ${"polygon".toUpperCase()}: ${aavePolygonHealth}`;

    // Get MakerDAO Mainnet C-Ratio
    return text;
}

/**
 * This function returns your wallet balance in that protocol, deposit, borrowed, debt, etc
 * @param {string} address 0x...
 * @param {string} protocol Protocol name like aave-v2, makerdao
 * @param {string} network Network chain like ethereum, polygon, bsc
 * @returns JSON object with wallet info in that protocol
 */
async function getProtocolInfo(address, protocol, network) {
    const res = await axios.get(`${ZAPPER_ENDPOINT}protocols/${protocol}/balances?addresses%5B%5D=${address}&network=${network}&api_key=${CONFIG.ZAPPER_API_KEY}`);
    return res.data;
}

function randomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

module.exports = { getGasPrices, getHealthFactor, randomString }