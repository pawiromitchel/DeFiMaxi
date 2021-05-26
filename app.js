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
    let network = text.split(' ');

    if (text.includes('/gas')) {
        bot.sendMessage(chatId, await FUNCTIONS.getGasPrices(network[1] ? network[1] : ''))
        .then((result) => {
            setTimeout(() => {
                bot.deleteMessage(chatId, result.message_id)
                bot.deleteMessage(chatId, msg.message_id)
            }, 10 * 1000)
        })
        .catch(err => console.log(err))
    }
});
