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

    if (text.includes('/gas')) {
        bot.sendMessage(chatId, await FUNCTIONS.getGasPrices());
    }
});
