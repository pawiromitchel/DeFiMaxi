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
        console.log(args[1]);
        let gasPrices = await FUNCTIONS.getGasPrices(network);

        if (gasPrices) {
            bot.sendMessage(chatId, `::GAS PRICES | ${network.toUpperCase()}::
🟢 Instant: ${gasPrices.instant}
🟡 Fast: ${gasPrices.fast}
🔴 Standard: ${gasPrices.standard}`)
                .catch(err => console.log(err))
        } else {
            bot.sendMessage(chatId, `Unsupported network`)
        }

    }

    // Set an level for Ethereum gas price
    if (text.includes('/level')) {
        const gasPrice = args[1];
        let recurring = args[2];

        if (recurring === "once") {
            recurring = 1;
        } else {
            recurring = 0;
        }

        if (gasPrice) {
            const record = {
                chatId: chatId,
                gasPrice: gasPrice,
                recurring: recurring
            }

            // save the config
            DB.setGasPrice(record);

            // send back the matched "whatever" to the chat
            bot.sendMessage(chatId, `✅ Gas level set at ${gasPrice} Gwei\nSet limit at 0 to disable alerts`);
        } else if (gasPrice === "0") {
            bot.sendMessage(chatId, `❌ Alert disabled`);
        } else {
            bot.sendMessage(chatId, `Give me a number to work with bro, are you dumb? 😂`)
        }
    }

    // check health for different protocols
    if (text.includes('/health')) {
        let address = args[1];

        // geen van ze mag leeg zijn
        if (address) {
            bot.sendMessage(chatId, await FUNCTIONS.getHealthFactor(address))
        } else {
            bot.sendMessage(chatId, 'Please provide your address after calling /health')
        }
    }

    // send fear and greenindex
    if (text.includes('/fear')) {
        bot.sendPhoto(chatId, `https://alternative.me/crypto/fear-and-greed-index.png?a=${Date.now()}`, {
            caption: "Source: https://alternative.me/crypto/fear-and-greed-index/"
        })
    }

    // send a random chatroom
    if (text.includes('/chatroom')) {
        let name = args[1] ? args[1] : FUNCTIONS.randomString(10);
        bot.sendMessage(chatId, `Anon room created at https://hack.chat/?${name}`);
    }

    // get TVL from defillama
    if (text.includes('/tvl')) {
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

        let url;
        let selector;

        // url paths
        const TVL = "https://defillama.com/home";
        const MULTI = "https://defillama.com/protocols";
        const ONE = "https://defillama.com/protocol";

        // selectors to get data
        let selectorTables = "#center > div > div > div.sc-fYxtnH.cXooYa.css-vurnku";
        let selectorDashboard = "#center > div > div.sc-ckVGcZ.bDWbWv > div > div.sc-ifAKCX.sc-bZQynM.sc-dnqmqq.kYubLu";
        let selectorSingle = "#center > div > div.sc-ckVGcZ.bDWbWv > div.sc-feJyhm.dBBDPo > div.sc-iELTvK.ifHHTx";

        if (args[1]) {
            selector = selectorTables;
            switch (args[1]) {
                case "protocols":
                    url = `${MULTI}/protocols`;
                    break;
                case "dex":
                case "dexes":
                    url = `${MULTI}/dexes`;
                    break;
                case "lending":
                    url = `${MULTI}/lending`;
                    break;
                case "yield":
                    url = `${MULTI}/yield`;
                    break;
                case "insurance":
                    url = `${MULTI}/insurance`;
                    break;
                case "options":
                    url = `${MULTI}/options`;
                    break;
                case "indexes":
                    url = `${MULTI}/indexes`;
                    break;
                case "staking":
                    url = `${MULTI}/staking`;
                    break;
                default:
                    url = `${ONE}/${args[1]}`;
                    selector = selectorSingle;
                    break;
            }
        } else {
            // if there's no protocol specified, show all
            url = TVL;
            selector = selectorDashboard;
        }
        await FUNCTIONS.screenshot(url, selector).then(photo => {
            bot.sendPhoto(chatId, photo, {
                caption: "Source: https://defillama.com"
            });
        });
    }
});

// check gas every hour
cron.schedule('00 * * * *', async () => {
    // get eth gas price
    const currentGas = await FUNCTIONS.getGasPrices('eth');
    // get gas limits from users
    const gasLimits = await DB.getData();

    // check if there are gaslimits set by users
    if (gasLimits.length > 0) {
        gasLimits.forEach(r => {
            if (r.gasPrice >= currentGas.fast) {
                // 0 = recurring alerts
                // 1 = once, then update 
                if (r.recurring >= 0) {
                    bot.sendMessage(r.chatId, `👀 Ppssst! Gas is at ${currentGas.fast.toFixed(1)} Gwei right now\nCheck /gas to make sure`)
                        .catch(err => console.log(err))

                    // user wants only one alert
                    if (r.recurring === 1) {
                        r.gasPrice = "0";
                        DB.setGasPrice(r);
                    }
                }
            }
        });
    } else {
        console.log(`No users to send alert to`);
    }
});