const axios = require('axios');
const puppeteer = require('puppeteer');
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
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function getDate() {
    let date_ob = new Date();
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = date_ob.getHours();

    // current minutes
    let minutes = date_ob.getMinutes();

    // current seconds
    let seconds = date_ob.getSeconds();

    // prints date
    return (year + "-" + month + "-" + date + "_" + hours + ":" + minutes + ":" + seconds);
}

async function screenshot(url) {
    console.log(url);
    // 1. Launch the browser and set the resolution
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            // 4k resolution
            width: 1024,
            height: 720,
            isLandscape: true
        }
    });
    const name = `./screenshots/${Date.now()}.jpg`;

    // 2. Open a new page
    const page = await browser.newPage();

    // 3. Navigate to URL
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // 4. Take screenshot
    await page.screenshot({
        path: name,
        type: "jpeg",
        fullPage: false
    });

    await page.close();
    await browser.close();

    return name;
}

module.exports = { getGasPrices, getHealthFactor, randomString, screenshot }