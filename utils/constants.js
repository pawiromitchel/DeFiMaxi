const MESSAGES = {
    info: `Hello 👋,
What can I, DeFiHelper 😎, do for you?

💳⛽ DeFi
/gas <chain> - get gas price from a specified chain, default will be ethereum
/level <number> - get an alert when hourly gas price is below your target
/health <address> - this will get your borrowing health from different protocols (work in progress)

📅 Metrics & Data
/bullrunindex - an index of metrics like the stock-to-flow, NUPL, Google search, Pi cycle top, etc
/btccycletop - a ML cycle top indicator
/stocktoflow | /stf - get Bitcoin Stock to Flow model made by PlanB
/unrealized_profitandloss | /pnl - BTC Unrealized Profit/Loss
/rhodl - check for market tops
/fear - check how emotional people are in the market.\nExtreme fear = buying opportunity\nExtreme greed = correction coming
/longvsshorts - get Long vs Shorts of BTC or ETH
/rekt - DeFi hacks leaderboard
/stakers - how many stakers does your blockchain have?
/fees <protocol> - how much fees are people paying?
/daotreasury - check what's on the balance sheet of your favorite DAO
/burn - how much ETH is being burned right now`,
    gettingData: `Aight G 😉, getting data ...`
}

module.exports = MESSAGES;