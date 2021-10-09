const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const CONFIG = require('./config');
const FUNCTIONS = require('./utils/functions');
const DB = require('./utils/handleData');
const MESSAGES = require('./utils/constants')

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

    // send info about the bot
    if (text.includes('/info')) {
        bot.sendMessage(chatId, MESSAGES.info);
    }

    if (text.includes('/longvsshorts')) {
        const url = "https://blockchainwhispers.com/bitmex-position-calculator";
        const BTC = "body > section > div > div:nth-child(3)";
        const ETH = "body > section > div > div.bcw-calculator-longs-shorts.eth.my-3";
        let selector;

        switch (args[1]) {
            case 'btc':
            case 'bitcoin':
                selector = BTC;
                break;
            case 'eth':
            case 'ethereum':
                selector = ETH;
                break;
            default:
                if (args[1] && !selector) {
                    bot.sendMessage(chatId, `Sorry bro, I'm too dumb to know what you're saying 😢\nI'll show you BTC longs vs shorts instead, okay?`);
                }
                selector = BTC;
                break;
        }

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/rekt')) {
        const url = "https://www.rekt.news/leaderboard/";
        let selector = "#__next > div > main > div > ol";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `DeFi Hacks Leaderboard, be careful out there sir 😘\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/stocktoflow') || text.includes('/stf')) {
        const url = "https://decentrader.com/charts/stock-to-flow-model/";
        let selector = "#graph > div > div";
        let cookieSelector = "#gdpr-cookie-accept";

        await FUNCTIONS.screenshot(url, selector, cookieSelector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `The stock-to-flow line on this chart incorporates a 365-day average into the model to smooth out the changes caused in the market by the halving events.\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/unrealized_profitandloss') || text.includes('/pnl')) {
        const url = "https://decentrader.com/charts/relative-unrealized-profit-loss/";
        let selector = "#graph > div > div";
        let cookieSelector = "#gdpr-cookie-accept";

        await FUNCTIONS.screenshot(url, selector, cookieSelector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `When market cap rises much faster than profit taking we see that the market is overheating, one could say due to investor greed (red band). For the strategic investor such times have historically been favourable to take profit.\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/rhodl')) {
        const url = "https://decentrader.com/charts/rhodl-ratio/";
        let selector = "#graph > div > div";
        let cookieSelector = "#gdpr-cookie-accept";

        await FUNCTIONS.screenshot(url, selector, cookieSelector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `RHODL ratio entering into the red band signals that the market is approaching the top of its cycle.  This has historically been a good time for investors to take profits in each cycle.\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/stakers')) {
        const url = "https://stakers.info/";
        let selector = "#__next > div > main > div.jsx-3513597878.list";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/daotreasury')) {
        const url = "https://open-orgs.info/";
        let selector = "#__next > div > main > div.jsx-3513597878.list";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/fees')) {
        let url = "https://cryptofees.info/";
        const ALL = "#__next > div > main > div.jsx-2013905549.list";
        const ONE = "#__next > div > main";
        let selector;

        if (args[1]) {
            selector = ONE;
            url += `protocol/${args[1]}`;
        } else {
            selector = ALL;
        }

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `There's tons of crypto projects\nWhich ones are people actually paying to use?\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/burn')) {
        const url = "https://etherchain.org/burn";
        let selector = "#app > div.card.mt-3";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: https://etherchain.org/burn`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/bullrunindex') || text.includes('/topsignal') || text.includes('/cbbi')) {
        const url = "https://colintalkscrypto.com/cbbi/";
        let selector = "#chart";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: https://colintalkscrypto.com/cbbi/\n\nAn "index" is an indicator based on a portfolio of metrics. The CBBI is an average of 11 different metrics. It helps us understand what stage of the Bitcoin bull run and bear market cycles we are in.`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/btccycletop')) {
        const url = "https://btcpredict.monicz.pl/";
        let selector = "body > div > div.prediction";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: https://btcpredict.monicz.pl/\n\nThis is a Bitcoin bull run prediction project which aims to evaluate current bull run's peak price alongside the exact date. The project consists of two individual machine-learning models trained on the Bitcoin's historical pricing and block halving data.`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/gimmedata')) {
        bot.sendPhoto(chatId, `https://alternative.me/crypto/fear-and-greed-index.png?a=${Date.now()}`, {
            caption: "Source: https://alternative.me/crypto/fear-and-greed-index/"
        })

        const url = "https://colintalkscrypto.com/cbbi/";
        let selector = "#chart";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: https://colintalkscrypto.com/cbbi/\n\nAn "index" is an indicator based on a portfolio of metrics. The CBBI is an average of 11 different metrics. It helps us understand what stage of the Bitcoin bull run and bear market cycles we are in.`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));

        const url = "https://decentrader.com/charts/stock-to-flow-model/";
        let selector = "#graph > div > div";
        let cookieSelector = "#gdpr-cookie-accept";

        await FUNCTIONS.screenshot(url, selector, cookieSelector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `The stock-to-flow line on this chart incorporates a 365-day average into the model to smooth out the changes caused in the market by the halving events.\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
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