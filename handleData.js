const fs = require('fs');

async function getData() {
    let rawdata = fs.readFileSync("data.json");
    let gasPriceLimits = JSON.parse(rawdata);
    // gasPrice 0 = give no alerts to the user
    let filtered = gasPriceLimits.filter(r => r.gasPrice !== "0");
    return filtered;
}

async function setGasPrice(record) {
    let rawdata = fs.readFileSync("data.json");
    let priceLimits = JSON.parse(rawdata);

    // if there's already a record with the chatId, overwrite the gasprice
    let check = priceLimits.filter(r => r.chatId === record.chatId);
    if(check.length > 0) {
        check[0].gasPrice = record.gasPrice;
        check[0].recurring = record.recurring;
    } else {
        priceLimits.push(record);
    }
    fs.writeFileSync('data.json', JSON.stringify(priceLimits));
}

module.exports = { getData, setGasPrice }