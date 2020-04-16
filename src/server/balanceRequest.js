const config = require('./config/config');
const fetch = require('node-fetch');
const crypto = require('crypto');
const querystring = require('querystring')
global.Headers = fetch.Headers;

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

const apiRequest = async (url, method, headers, body) => {
    let catch_res;
    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body
        });
        //console.log(response);
        const json = await response.json();
        //console.log(json)
        return json;
    } catch (error) {
        let time = Date();
        console.log(JSON.stringify({ time, location: 'apiRequest', error, catch_res }, null, 4));
        return (error);
    }
}

const batchApiBalanceRequest = async () => {
    let balanceResults = {};

    let coinfloor_url_btcgbp = 'https://webapi.coinfloor.co.uk/bist/XBT/GBP/balance/';
    let coinfloor_url_ethgbp = 'https://webapi.coinfloor.co.uk/bist/ETH/GBP/balance/';
    let coinfloor_headers = { 'Authorization': 'Basic ' + Buffer.from(config.credential.coinfloor.userid + '/' + config.credential.coinfloor.apikey + ":" + config.credential.coinfloor.password).toString('base64') };

    const coinbase_url = config.credential.coinbase.apiURL + '/accounts';
    let coinbase_timestamp = Date.now() / 1000;
    coinbase_headers = {
        'CB-ACCESS-KEY': config.credential.coinbase.apikey,
        'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'GET', '/accounts', "", config.credential.coinbase.base64secret),
        'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
        'CB-ACCESS-PASSPHRASE': config.credential.coinbase.passphrase
    }

    let binance_burl = 'https://api.binance.com';
    let binance_endpoint = '/api/v3/account';
    let binance_dataQueryString = 'recvWindow=20000&timestamp=' + Date.now();
    let binance_headers = { 'X-MBX-APIKEY': config.credential.binance.apiKey };

    let kraken_url = 'https://api.kraken.com/0/private/Balance';
    let nonce = new Date() * 1000;
    let kraken_postData = {
        nonce: nonce
    };
    let kraken_body = JSON.stringify(kraken_postData);

    let signature = krakenSignature('/0/private/Balance', kraken_body, config.credential.kraken.private_key, nonce);
    let kraken_headers = {
        'User-Agent': 'Kraken Javascript API Client',
        'API-Key': config.credential.kraken.api,
        'API-Sign': signature,
        'Content-type': 'application/json'
    }

    let cex_url = 'https://cex.io/api/balance/';
    let cex_headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    let cex_timestamp = Math.floor(Date.now() / 1000);

    let message = cex_timestamp.toString() + config.credential.cex.userid + config.credential.cex.apiKey;
    let cex_signature = crypto.createHmac('sha256', Buffer.from(config.credential.cex.secretKey)).update(message).digest('hex');

    let cex_args = {
        key: config.credential.cex.apiKey,
        signature: cex_signature.toUpperCase(),
        nonce: cex_timestamp.toString(),
    }

    let cex_body = querystring.stringify(cex_args);

    let promiseArr = [
        {
            url: coinfloor_url_btcgbp,
            method: 'get',
            headers: coinfloor_headers,
            body: null,
            key: 'coinfloor-btcgbp'
        },
        {
            url: coinfloor_url_ethgbp,
            method: 'get',
            headers: coinfloor_headers,
            body: null,
            key: 'coinfloor-ethgbp'
        },
        {
            url: coinbase_url,
            method: 'get',
            headers: coinbase_headers,
            body: null,
            key: 'coinbase'
        },
        {
            url: binance_burl + binance_endpoint + '?' + binance_dataQueryString + '&signature=' + binanceSignature(binance_dataQueryString, config.credential.binance),
            method: 'GET',
            headers: binance_headers,
            body: null,
            key: 'binance',
        },
        {
            url: kraken_url,
            method: 'POST',
            headers: kraken_headers,
            body: kraken_body,
            key: 'kraken',
        },
        {
            url: cex_url,
            method: 'POST',
            headers: cex_headers,
            body: cex_body,
            key: 'cex',
        }
    ]
    await Promise.all(promiseArr.map(async (req) => {
        let apiRes = await apiRequest(req.url, req.method, req.headers, req.body);
        try {
            if (!balanceResults.hasOwnProperty('coinfloor')) {
                balanceResults['coinfloor'] = {};
            }
            if (req.key == 'coinfloor-btcgbp') {
                balanceResults['coinfloor'].BTC = apiRes.xbt_available;
                balanceResults['coinfloor'].GBP = apiRes.gbp_available;
            }
            if (req.key == 'coinfloor-ethgbp') {
                balanceResults['coinfloor'].ETH = apiRes.eth_available;
                balanceResults['coinfloor'].GBP = apiRes.gbp_available;
            }
            if (req.key == 'coinbase') {
                balanceResults[req.key] = {};
                apiRes.map(value => {
                    switch (value.currency) {
                        case 'EUR': balanceResults[req.key].EUR = value.available; break;
                        case 'BTC': balanceResults[req.key].BTC = value.available; break;
                        case 'GBP': balanceResults[req.key].GBP = value.available; break;
                        case 'ETH': balanceResults[req.key].ETH = value.available; break;
                        case 'LTC': balanceResults[req.key].LTC = value.available; break;
                        default: balanceResults[req.key][value.currency] = value.available; break;
                    }
                })
            }
            if (req.key == 'binance') {
                balanceResults[req.key] = {};
                apiRes.balances.map(value => {
                    switch (value.asset) {
                        case 'BTC': balanceResults[req.key].BTC = value.free; break;
                        case 'ETH': balanceResults[req.key].ETH = value.free; break;
                        case 'LTC': balanceResults[req.key].LTC = value.free; break;
                        case 'XRP': balanceResults[req.key].XRP = value.free; break;
                        case 'XMR': balanceResults[req.key].XMR = value.free; break;
                        case 'BNB': balanceResults[req.key].BNB = value.free; break;
                        default: balanceResults[req.key][value.asset] = value.free; break;
                    }
                })
            }
            if (req.key == 'kraken') {
                balanceResults[req.key] = {};
                Object.keys(apiRes.result).map(asset => {
                    switch (asset) {
                        case 'XXBT': balanceResults[req.key].BTC = apiRes.result[asset]; break;
                        case 'XETH': balanceResults[req.key].ETH = apiRes.result[asset]; break;
                        case 'XLTC': balanceResults[req.key].LTC = apiRes.result[asset]; break;
                        case 'ZGBP': balanceResults[req.key].GBP = apiRes.result[asset]; break;
                        case 'ZEUR': balanceResults[req.key].EUR = apiRes.result[asset]; break;
                        default: balanceResults[req.key][asset] = apiRes.result[asset]; break;
                    }
                })
            }
            if (req.key == 'cex') {
                balanceResults[req.key] = {};
                Object.keys(apiRes).map(key => {
                    switch (key) {
                        case 'timestamp': break;
                        case 'username': break;
                        case 'error': console.log(apiRes[key]); break;
                        default: balanceResults[req.key][key] = apiRes[key].available; break;
                    }
                })
            }
        } catch (error) {
            console.log(error);
            console.log(apiRes);
        }
    }));
    //console.log(balanceResults);
    return balanceResults;
}

//module.exports = batchApiBalanceRequest();

const request = async (callback) => {
    let balance = await batchApiBalanceRequest();
    callback(balance);
}

module.exports = { request, batchApiBalanceRequest };

// requestBalance((balance)=>{
//     console.log(balance);
// });
