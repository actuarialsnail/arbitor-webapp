const nodemailer = require('nodemailer');
const config = require('./config/config');

const transporter = nodemailer.createTransport(config.arbitorCoinNodeMailerCred);

const from = config.arbitorCoinNodeMailerCred.auth.user;
const to = config.nodemailRecipients;

const sendMail = (type, msg, filename) => {
    let mailOptions = { from, to };

    switch (type) {
        case 'trade':
            mailOptions.subject = 'Arbitor - trade notification';
            mailOptions.text = JSON.stringify(msg, null, 4);
            break;
        case 'opportunity':
            mailOptions.subject = 'Arbitor - opportunities summary';
            mailOptions.text = msg;
            mailOptions.attachments = [
                {
                    filename, path: './hcd/' + filename,
                },
            ]
            break;
        default:
            break;
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = { sendMail };

const mode = process.argv[2] || false;

if (mode === "test") {
    // sendMail('opportunity', 'Attached.', '2020-06-26.html');
    // const tradeRes = { "type": "execution", "timestamp": 1592258184636, "verificationLog": { "type": "verification", "timestamp": [1592258184046, 1592258183997, 1592258184063], "route": ["EUR-BTC-kraken", "BTC-EUR-binance"], "price": [0.00012013599394514592, 8397.3, 1.0051888601472867], "mktSize": [6659.12, 0.055448, 462.74674874674145], "accSize": ["36.0338", "0.00410267", 34.239236828754755], "tradeFee": [0.0026, 0.001], "tradeSide": ["buy", "sell"], "tradeKey": ["BTC-EUR-kraken", "BTC-EUR-binance"], "refMult": 0.00012003634700587339, "refValue": 0.000021325970878490402, "priceApiData": { "BTC-EUR-kraken": { "bid": ["8329.70000", "0.086"], "ask": ["8334.70000", "0.375"] }, "BTC-EUR-binance": { "bid": ["8396.67000000", "0.00595400"], "ask": ["8397.31000000", "0.02540800"] } }, "verification1": [{ "sv": 36.0338, "ev": 0.0043121, "tradeQty": 0.0043121 }, { "sv": 0.004102, "ev": 34.40869719966, "tradeQty": 0.004102 }], "verification2": [{ "sv": 34.23107692878552, "ev": 0.00409637, "tradeQty": 0.00409637 }, { "sv": 0.004096, "ev": 34.35836755968, "tradeQty": 0.004096 }], "tradeSizeMax": [0.00409637, 0.004096], "status": true }, "balancePrior": { "kraken": { "EUR": "36.0338", "BTC": "0.0072422000" }, "binance": { "BTC": "0.00410267", "EUR": "0.98606841" } }, "orderParams": [{ "exchange": "kraken", "pair": "BTC-EUR", "quantity_base": 0.00409637, "buysell": "buy", "price": 0.00012013599394514592 }, { "exchange": "binance", "pair": "BTC-EUR", "quantity_base": 0.004096, "buysell": "sell", "price": 8397.3 }], "tradeRes": [{ "kraken": { "error": [], "result": { "descr": { "order": "buy 0.00409637 XBTEUR @ market" } } } }, { "binance": {} }], "balancePost": { "kraken": { "EUR": "1.8554", "BTC": "0.0113376100" }, "binance": { "BTC": "0.00000767", "EUR": "35.37301191" } } }
    // sendMail('trade', tradeRes, null);
}