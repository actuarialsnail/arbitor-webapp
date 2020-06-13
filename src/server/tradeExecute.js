const config = require('./config/config');
const fetch = require('node-fetch');
const crypto = require('crypto');
const querystring = require('querystring')

const balanceObjFilter = (balanceObj, route) => {
    let filtered = {};
    for (r of route) {
        const [p1, p2, exchange] = r.split('-');
        filtered[exchange] = {};
        filtered[exchange][p1] = balanceObj[exchange][p1];
        filtered[exchange][p2] = balanceObj[exchange][p2];
    }
    return filtered;
}

const krakenMap = {
    'BTC-GBP': 'XXBTZGBP',
    'ETH-GBP': 'XETHZGBP',
    'BTC-EUR': 'XXBTZEUR',
    'ETH-EUR': 'XETHZEUR',
    'BCH-EUR': 'BCHEUR',
    'LTC-EUR': 'XLTCZEUR',
    'BCH-BTC': 'BCHXBT',
    'ETH-BTC': 'XETHXXBT',
    'LTC-BTC': 'XLTCXXBT',
    'BAT-BTC': 'BATXBT',
    'BAT-ETH': 'BATETH',
    'BAT-EUR': 'BATEUR',
    'XRP-BTC': 'XXRPXXBT',
    'XRP-EUR': 'XXRPZEUR',
    'EUR-GBP': 'EURGBP',
}

const execute = async (tradeObj, balanceData, trade_sandbox) => {
    let execute_output = {
        type: 'execution',
        timestamp: Date.now(),
        verificationLog: { ...tradeObj },
        balancePrior: balanceObjFilter(balanceData, tradeObj.route)
    }

    //prepare the order array
    let orders = tradeObj.route.map((order, index) => {
        let param = {}
        const [p1, p2, exchange] = tradeObj.tradeKey[index].split('-');
        param.exchange = exchange;
        param.pair = p1 + '-' + p2;
        param.quantity_base = tradeObj.tradeSizeMax[index];
        param.buysell = tradeObj.tradeSide[index];
        param.price = tradeObj.price[index];
        return param;
    })
    execute_output['orderParams'] = orders;

    // set up base inputs required for promise Arr
    // set up promise Arr based on optimised size management
    let promiseArr = orders.map((order) => {
        let param = {}
        param.key = order.exchange;
        let [p1, p2] = order.pair.split('-');
        switch (order.exchange) {
            case 'coinfloor':
                let coinfloor_endpoint = 'https://webapi.coinfloor.co.uk/bist/';
                p1 = p1 == 'BTC' ? 'XBT' : p1;
                coinfloor_endpoint += p1 + '/' + p2 + (order.buysell == 'buy' ? '/buy_market/' : '/sell_market/');

                const coinfloor_cred = trade_sandbox ? 'coinfloor_sandbox' : 'coinfloor';
                const coinfloor_headers = { 'Authorization': 'Basic ' + Buffer.from(config.credential[coinfloor_cred].userid + '/' + config.credential[coinfloor_cred].apikey + ":" + config.credential[coinfloor_cred].password).toString('base64') };

                const { URLSearchParams } = require('url');
                const cf_params = new URLSearchParams();
                cf_params.append('quantity', order.quantity_base); // quantiy/total for market orders, price/amount for limit orders

                param.url = coinfloor_endpoint;
                param.method = 'POST';
                param.headers = coinfloor_headers;
                param.body = cf_params;
                break;

            case 'coinbase':
                const coinbase_timestamp = Date.now() / 1000;
                const coinbase_body = {
                    size: order.quantity_base,
                    type: 'market',
                    side: order.buysell,
                    product_id: p1 + '-' + p2
                }

                const coinbase_cred = trade_sandbox ? 'coinbase_sandbox' : 'coinbase';
                const cb_private_url = config.credential[coinbase_cred].apiURL + '/orders';
                const coinbase_headers = {
                    'CB-ACCESS-KEY': config.credential[coinbase_cred].apikey,
                    'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'POST', '/orders', JSON.stringify(coinbase_body), config.credential[coinbase_cred].base64secret),
                    'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
                    'CB-ACCESS-PASSPHRASE': config.credential[coinbase_cred].passphrase,
                    'Content-Type': 'application/json'
                }

                param.url = cb_private_url;
                param.method = 'POST';
                param.headers = coinbase_headers;
                param.body = JSON.stringify(coinbase_body);
                break;

            case 'binance':
                const binance_burl = 'https://api.binance.com';
                const binance_endpoint = (trade_sandbox ? '/api/v3/order/test' : '/api/v3/order');

                binance_headers = {
                    'X-MBX-APIKEY': config.credential.binance.apiKey
                };

                const binance_dataQueryString = 'recvWindow=20000&timestamp=' + Date.now() + '&symbol=' + p1 + p2 + '&side=' + order.buysell + '&type=market&quantity=' + order.quantity_base;
                param.url = binance_burl + binance_endpoint + '?' + binance_dataQueryString + '&signature=' + binanceSignature(binance_dataQueryString, config.credential.binance);
                param.method = 'POST';
                param.headers = binance_headers;
                param.body = null;
                break;

            case 'kraken':
                const kraken_burl = 'https://api.kraken.com';
                const kraken_path = '/0/private/AddOrder';
                const nonce = new Date() * 1000;
                const requestData = {
                    pair: krakenMap[order.pair],
                    type: order.buysell,
                    ordertype: 'market',
                    volume: order.quantity_base,
                    nonce: nonce,
                    validate: trade_sandbox,
                };

                const signature = krakenSignature(kraken_path, JSON.stringify(requestData), config.credential.kraken.private_key, nonce);
                const kraken_headers = {
                    'User-Agent': 'Kraken Javascript API Client',
                    'API-Key': config.credential.kraken.api,
                    'API-Sign': signature,
                    'Content-type': 'application/json',
                }

                param.url = kraken_burl + kraken_path;
                param.headers = kraken_headers;
                param.method = 'POST';
                param.body = JSON.stringify(requestData);
                break;

            case 'cex':
                const cex_url = 'https://cex.io/api/place_order/' + p1 + '/' + p2;

                const cex_headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                const cex_timestamp = Math.floor(Date.now() / 1000);

                const message = cex_timestamp.toString() + config.credential.cex.userid + config.credential.cex.apiKey;
                const cex_signature = crypto.createHmac('sha256', Buffer.from(config.credential.cex.secretKey)).update(message).digest('hex');

                const cex_args = {
                    key: config.credential.cex.apiKey,
                    signature: cex_signature.toUpperCase(),
                    nonce: cex_timestamp.toString(),
                    order_type: 'market',
                    type: order.buysell,
                    amount: order.quantity_base * order.price, // for market buy CEX.io requires the amount of quote currency to spend
                }

                param.url = cex_url;
                param.method = 'POST';
                param.headers = cex_headers;
                param.body = querystring.stringify(cex_args);
                break;

            default:
                console.log('unknown exchange requested');
                break;
        }
        return param;
    });

    const tradeRes = await batchApiOrderExecuteRequest(promiseArr);
    execute_output['tradeRes'] = tradeRes

    return execute_output;
}

const apiRequest = async (url, method, headers, body) => {
    let catch_res;
    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body
        });
        catch_res = response;
        // console.log(response);
        const json = await response.json();
        return json;
    } catch (error) {
        let time = Date();
        console.log(JSON.stringify({ time, location: 'apiRequest', error, catch_res }, null, 4));
        return (error);
    }
}

const batchApiOrderExecuteRequest = async (promiseArr) => {
    let orderExecuteRes = [];
    orderExecuteRes = await Promise.all(promiseArr.map(async (req) => {
        let apiRes = await apiRequest(req.url, req.method, req.headers, req.body);
        return { [req.key]: apiRes };
    }));
    return orderExecuteRes;
}

const binanceSignature = (query, keys) => {
    let hmac = crypto.createHmac('sha256', keys.secretKey);
    let signature = hmac.update(query).digest('hex');
    return signature;
}

const coinbaseSignature = (timestamp, method, requestPath, body, secret) => {
    // create the prehash string by concatenating required parts
    var what = timestamp + method + requestPath + body;
    // decode the base64 secret
    var key = Buffer.from(secret, 'base64');
    // create a sha256 hmac with the secret
    var hmac = crypto.createHmac('sha256', key);
    // sign the require message with the hmac
    // and finally base64 encode the result
    return hmac.update(what).digest('base64');
}

const krakenSignature = (path, request, secret, nonce) => {
    const message = request;
    const secret_buffer = Buffer.from(secret, 'base64');
    const hash = new crypto.createHash('sha256');
    const hmac = new crypto.createHmac('sha512', secret_buffer);
    const hash_digest = hash.update(nonce + message).digest('binary');
    const hmac_digest = hmac.update(path + hash_digest, 'binary').digest('base64');
    return hmac_digest;
};

const placeLimitOrders = async (requestObj, cb) => {
    console.log(requestObj);
    let promiseArr = [];
    for (reqOrder of requestObj) {
        if (reqOrder.text === '') {
            cb('error: text not found');
            continue;
        }
        let credSet = config.credSet[reqOrder.text] || 'not found';
        if (credSet === 'not found') {
            cb('error: cred set not found');
            continue;
        };
        let [p1, p2] = reqOrder.pair.split('-');
        switch (reqOrder.exchange) {
            case 'coinfloor':
                p1 = p1 == 'BTC' ? 'XBT' : p1;
                let coinfloor_endpoint = 'https://webapi.coinfloor.co.uk/bist/';
                coinfloor_endpoint += p1 + '/' + p2 + (reqOrder.side == 'buy' ? '/buy/' : '/sell/');
                const coinfloor_cred = credSet.coinfloor;
                const coinfloor_headers = {
                    'Authorization': 'Basic ' + Buffer.from(config.credential[coinfloor_cred].userid + '/' + config.credential[coinfloor_cred].apikey + ":" + config.credential[coinfloor_cred].password).toString('base64')
                };
                const { URLSearchParams } = require('url');
                const cf_params = new URLSearchParams(coinfloor_endpoint);
                // // cf_params.append('quantity', 1);
                cf_params.append('amount', reqOrder.size);
                cf_params.append('price', reqOrder.price);

                const coinfloor_orderParam = {
                    url: coinfloor_endpoint,
                    method: 'POST',
                    headers: coinfloor_headers,
                    body: cf_params,
                }
                promiseArr.push(coinfloor_orderParam);
                break;
            case 'coinbase':
                const coinbase_cred = credSet.coinbase;
                const coinbase_timestamp = Date.now() / 1000;
                const coinbase_body = {
                    size: reqOrder.size,
                    price: reqOrder.price,
                    type: reqOrder.type,
                    side: reqOrder.side,
                    product_id: reqOrder.pair,
                };
                const coinbase_orderParam = {
                    url: config.credential[coinbase_cred].apiURL + '/orders',
                    method: 'POST',
                    headers: {
                        'CB-ACCESS-KEY': config.credential[coinbase_cred].apikey,
                        'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'POST', '/orders', JSON.stringify(coinbase_body), config.credential[coinbase_cred].base64secret),
                        'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
                        'CB-ACCESS-PASSPHRASE': config.credential[coinbase_cred].passphrase,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(coinbase_body)
                }
                promiseArr.push(coinbase_orderParam);
                break;
            case 'kraken':
                const kraken_cred = credSet.kraken;
                const kraken_burl = 'https://api.kraken.com';
                const kraken_path = '/0/private/AddOrder';
                const nonce = new Date() * 1000;
                const requestData = {
                    pair: krakenMap[reqOrder.pair],
                    type: reqOrder.side,
                    ordertype: reqOrder.type,
                    volume: reqOrder.size,
                    price: reqOrder.price,
                    nonce: nonce
                };
                const signature = krakenSignature(kraken_path, JSON.stringify(requestData), config.credential[kraken_cred].private_key, nonce);
                const kraken_orderParam = {
                    url: kraken_burl + kraken_path,
                    method: 'POST',
                    headers: {
                        'User-Agent': 'Kraken Javascript API Client',
                        'API-Key': config.credential[kraken_cred].api,
                        'API-Sign': signature,
                        'Content-type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                }
                promiseArr.push(kraken_orderParam);
                break;
            case 'binance':
                const binance_cred = credSet.binance;
                const binance_burl = 'https://api.binance.com';
                const binance_endpoint = '/api/v3/order';
                const binance_dataQueryString = 'recvWindow=20000&timestamp=' + Date.now() + '&symbol=' + p1 + p2 + '&side=' + reqOrder.side + '&type=' + reqOrder.type + '&quantity=' + reqOrder.size + '&price=' + reqOrder.price + '&timeInForce=GTC';
                const binance_orderParam = {
                    url: binance_burl + binance_endpoint + '?' + binance_dataQueryString + '&signature=' + binanceSignature(binance_dataQueryString, config.credential[binance_cred]),
                    method: 'POST',
                    headers: {
                        'X-MBX-APIKEY': config.credential[binance_cred].apiKey
                    },
                    body: null
                }
                promiseArr.push(binance_orderParam);
                break;
            case 'cex':
                const cex_cred = credSet.cex;
                const cex_url = 'https://cex.io/api/place_order/' + p1 + '/' + p2;

                const cex_headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                const cex_timestamp = Math.floor(Date.now() / 1000);

                const message = cex_timestamp.toString() + config.credential[cex_cred].userid + config.credential[cex_cred].apiKey;
                const cex_signature = crypto.createHmac('sha256', Buffer.from(config.credential[cex_cred].secretKey)).update(message).digest('hex');

                const cex_args = {
                    key: config.credential[cex_cred].apiKey,
                    signature: cex_signature.toUpperCase(),
                    nonce: cex_timestamp.toString(),
                    order_type: reqOrder.type,
                    type: reqOrder.side,
                    price: reqOrder.price,
                    amount: reqOrder.type === 'market' ? reqOrder.size * reqOrder.price : reqOrder.size, // for market buy CEX.io requires the amount of quote currency to spend
                }

                const cex_body = querystring.stringify(cex_args);
                const cex_orderParam = {
                    url: cex_url,
                    method: 'POST',
                    headers: cex_headers,
                    body: cex_body
                }
                promiseArr.push(cex_orderParam);
                break;
            default:
                console.log('unknown exchange requested');
                break;
        } //switch
    }
    let res = await batchApiOrderExecuteRequest(promiseArr);
    cb(res);
}

module.exports = { balanceObjFilter, execute, placeLimitOrders }

const prototype_mode = process.argv[2] || false;

if (prototype_mode == "true") {

    const fs = require('fs');
    const readline = require('readline');
    const balanceData = require('./log/balanceData-test.json');
    let validationLogs = [];
    let path = './log/validation-test.json'

    try {
        if (fs.existsSync(path)) {
            //file exists
            const readInterface = readline.createInterface({
                input: fs.createReadStream(path),
                //output: process.stdout,
                console: false
            });

            readInterface.on('line', (line) => {
                validationLogs.push(JSON.parse(line))
            });

            readInterface.on('close', async () => {
                console.log(`Validation records to run: ${validationLogs.length}`);
                for (verifyOutput of validationLogs) {
                    if (verifyOutput.status) {
                        const tradeRes = await execute(verifyOutput, balanceData, false);
                        console.log(JSON.stringify(tradeRes.tradeRes));
                    }
                }
            })

        } else {
            console.log('no files found')
        }
    } catch (err) {
        console.error(err)
    }
}