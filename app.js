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

    // send info about the bot
    if (text.includes('/info')) {
        bot.sendMessage(chatId, `Hello master ${msg.from.first_name} 👋,
What can I, DeFiHelper 😎, do for you?

⛽ Gas prices
/gas <chain> - get gas price from a specified chain, default will be ethereum
/level <number> - get an alert when hourly gas price is below your target

💳 Borrowing Health or Ratio
/health <address> - this will get your borrowing health from different protocols (work in progress)

🩸 Fear and Green Index
/fear - check how emotional people are in the market.
        Extreme fear = buying opportunity
        Extreme greed = correction coming

💰 Total Value Locked
/tvl - this will show the total TVL across every chain / L2 / sidechain
/tvl <network> - if you want to check the tvl of only xdai or matic
/tvl <protocol> - if you wanna see the tvl of Aave for example
/tvl <group> - check tvl of specific groups like protocols, staking, lending, options, insurance, indexes

📅 Indicators & Data
/stocktoflow | /stf - get Bitcoin Stock to Flow model made by PlanB
/longvsshorts - get Long vs Shorts of BTC or ETH
/ecocalendar - get economic calendar
/rekt - DeFi hacks leaderboard
/stakers - how many stakers does your blockchain have?
/fees <protocol> - how much fees are people paying?
/daotreasury - check what's on the balance sheet of your favorite DAO

👀 ChatRoom
/room <roomname> - this will generate a random room on hack.chat to chat fully anon mode

On yeah, my creator is @pawiromitchel 🤗
He's constantly teaching me new stuff, so be on the lookout for new functionalities
`);
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
                case "eth":
                case "ethereum":
                    url = `https://defillama.com/chain/Ethereum`;
                    selector = selectorDashboard;
                    break;
                case "bsc":
                case "binance":
                    url = `https://defillama.com/chain/Binance`;
                    selector = selectorDashboard;
                    break;
                case "sol":
                case "solana":
                    url = `https://defillama.com/chain/Solana`;
                    selector = selectorDashboard;
                    break;
                case "matic":
                case "polygon":
                    url = `https://defillama.com/chain/Polygon`;
                    selector = selectorDashboard;
                    break;
                case "ftm":
                    url = `https://defillama.com/chain/Fantom`;
                    selector = selectorDashboard;
                    break;
                case "xdai":
                    url = `https://defillama.com/chain/xDai`;
                    selector = selectorDashboard;
                    break;
                case "rsk":
                    url = `https://defillama.com/chain/RSK`;
                    selector = selectorDashboard;
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
                caption: `Source: ${url}`
            });
        });
    }

    if (text.includes('/longvsshorts')) {
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

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
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

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
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

        const url = "https://decentrader.com/charts/stock-to-flow-model/";
        let selector = "#graph > div > div";
        let cookieSelector = "#gdpr-cookie-accept";

        await FUNCTIONS.screenshot(url, selector, cookieSelector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/stakers')) {
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

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
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

        const url = "https://open-orgs.info/";
        let selector = "#__next > div > main > div.jsx-3513597878.list";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Source: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/ecocalendar')) {
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

        const url = "https://global-premium.econoday.com/byweek.asp?cust=global-premium&lid=0";
        let selector = "body > table > tbody > tr:nth-child(4) > td > table:nth-child(1)";

        await FUNCTIONS.screenshot(url, selector)
            .then(photo => {
                bot.sendPhoto(chatId, photo, {
                    caption: `Timezone is GMT -5:00 ET\nSource: ${url}`
                });
            }).catch(err => bot.sendMessage(chatId, `Something went wrong: ${err}`));
    }

    if (text.includes('/fees')) {
        bot.sendMessage(chatId, `Aight G 😉, getting data ...`)
            .then((chat) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, chat.message_id)
                }, 10 * 1000) // 10 sec
            })
            .catch(err => console.log(err));

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