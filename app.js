const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const CONFIG = require('./config');
const FUNCTIONS = require('./functions');
const DB = require('./handleData');

const token = CONFIG.TELEGRAM_BOT_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
bot.on("polling_error", (msg) => console.log(msg));
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    let text = msg.text ? msg.text : '';
    let args = text.split(' ');

    // Get gas price from eth, bsc or matic
    if (text.includes('/gas')) {
        let network = args[1] ? args[1] : 'ethereum';
        let gasPrices = await FUNCTIONS.getGasPrices();

        bot.sendMessage(chatId, `::GAS PRICES | ${network.toUpperCase()}::
🟢 Instant: ${gasPrices.instant}
🟡 Fast: ${gasPrices.fast}
🔴 Standard: ${gasPrices.standard}`)
            .then((result) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, result.message_id)
                }, 3600000) // keep the message for 1 hour
            })
            .catch(err => console.log(err))
    }

    if (text.includes('/health')) {
        let network = args[1];
        let protocol = args[2];
        let address = args[3];

        // geen van ze mag leeg zijn
        if (network && protocol && address) {
            bot.sendMessage(chatId, await FUNCTIONS.getHealthFactor(protocol, network, address))
        } else {
            bot.sendMessage(chatId, 'Please provide the right parameters\nFor example /health polygon aave 0x...')
        }
    }
});

// Set an level for Ethereum gas price
bot.onText(/\/level (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const gasPrice = match[1];

    if(gasPrice !== "0") {
        const record = {
            chatId: chatId,
            gasPrice: gasPrice
        }
    
        // save the config
        DB.setGasPrice(record);
    
        // send back the matched "whatever" to the chat
        bot.sendMessage(chatId, `✅ Gas level set at ${gasPrice}\nSet limit at 0 to disable alerts`);
    } else {
        bot.sendMessage(chatId, `❌ Alert disabled`);
    }
});

// check gas every hour
cron.schedule('0 * * * *', async () => {
    // get eth gas price
    const currentGas = await FUNCTIONS.getGasPrices('eth');
    // get gas limits from users
    const gasLimits = await DB.getData();

    // check if there are gaslimits set by users
    if (gasLimits.length > 0) {
        gasLimits.forEach(r => {
            if (r.gasPrice >= currentGas.fast) {
                bot.sendMessage(r.chatId, `👀 Ppssst! Gas is at ${currentGas.fast.toFixed(1)} right now\nCheck /gas to make sure`)
                    .then((result) => {
                        setTimeout(() => {
                            bot.deleteMessage(chatId, result.message_id)
                        }, 3600000) // keep the message for 1 hour
                    })
                    .catch(err => console.log(err))
            }
        });
    } else {
        console.log(`No users to send alert to`);
    }
});