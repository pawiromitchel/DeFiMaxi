const TelegramBot = require('node-telegram-bot-api');
const CONFIG = require('./config');
const FUNCTIONS = require('./functions');

const token = CONFIG.TELEGRAM_BOT_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
bot.on("polling_error", (msg) => console.log(msg));
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    let text = msg.text ? msg.text : '';
    let args = text.split(' ');

    if (text.includes('/gas')) {
        let network = args[1];
        bot.sendMessage(chatId, await FUNCTIONS.getGasPrices(network ? network : ''))
        .then((result) => {
            setTimeout(() => {
                bot.deleteMessage(chatId, result.message_id)
            }, 10 * 1000)
        })
        .catch(err => console.log(err))
    }

    if (text.includes('/health')) {
        let network = args[1];
        let protocol = args[2];
        let address = args[3];

        // geen van ze mag leeg zijn
        if(network && protocol && address) {
            bot.sendMessage(chatId, await FUNCTIONS.getHealthFactor(protocol, network, address))
        } else {
            bot.sendMessage(chatId, 'Please provide the right parameters\nFor example /health polygon aave 0x...')
        }
    }
});
