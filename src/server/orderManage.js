const config = require('./config/config');
const crypto = require('crypto');
const querystring = require('querystring')

const { binanceSignature, coinbaseSignature, krakenSignature, apiRequest } = require('./utilities');

const batchOpenOrdersRequest = async (credSet) => {
    let openOrderResults = {};
    let lookupKey = {};
    if (config.credSet.hasOwnProperty(credSet)) {
        lookupKey = config.credSet[credSet];
    } else {
        return {};
    }

    let coinfloor_url_btcgbp = 'https://webapi.coinfloor.co.uk/bist/XBT/GBP/open_orders/';
    let coinfloor_headers = { 'Authorization': 'Basic ' + Buffer.from(config.credential[lookupKey.coinfloor].userid + '/' + config.credential[lookupKey.coinfloor].apikey + ":" + config.credential[lookupKey.coinfloor].password).toString('base64') };

    const coinbase_url = config.credential[lookupKey.coinbase].apiURL + '/orders';
    let coinbase_timestamp = Date.now() / 1000;
    const coinbase_headers = {
        'CB-ACCESS-KEY': config.credential[lookupKey.coinbase].apikey,
        'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'GET', '/orders', "", config.credential[lookupKey.coinbase].base64secret),
        'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
        'CB-ACCESS-PASSPHRASE': config.credential[lookupKey.coinbase].passphrase
    }

    let binance_burl = 'https://api.binance.com';
    let binance_endpoint = '/api/v3/openOrders';
    let binance_dataQueryString = 'recvWindow=20000&timestamp=' + Date.now();
    let binance_headers = { 'X-MBX-APIKEY': config.credential[lookupKey.binance].apiKey };

    let kraken_url = 'https://api.kraken.com/0/private/OpenOrders';
    let nonce = new Date() * 1000;
    let kraken_postData = {
        nonce: nonce
    };
    let kraken_body = JSON.stringify(kraken_postData);

    let signature = krakenSignature('/0/private/OpenOrders', kraken_body, config.credential[lookupKey.kraken].private_key, nonce);
    let kraken_headers = {
        'User-Agent': 'Kraken Javascript API Client',
        'API-Key': config.credential[lookupKey.kraken].api,
        'API-Sign': signature,
        'Content-type': 'application/json'
    }

    let cex_url = 'https://cex.io/api/open_orders/';
    let cex_headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    let cex_timestamp = Math.floor(Date.now() / 1000);

    let message = cex_timestamp.toString() + config.credential[lookupKey.cex].userid + config.credential[lookupKey.cex].apiKey;
    let cex_signature = crypto.createHmac('sha256', Buffer.from(config.credential[lookupKey.cex].secretKey)).update(message).digest('hex');

    let cex_args = {
        key: config.credential[lookupKey.cex].apiKey,
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
            key: 'coinfloor'
        },
        {
            url: coinbase_url,
            method: 'get',
            headers: coinbase_headers,
            body: null,
            key: 'coinbase'
        },
        {
            url: binance_burl + binance_endpoint + '?' + binance_dataQueryString + '&signature=' + binanceSignature(binance_dataQueryString, config.credential[lookupKey.binance]),
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
        // console.log(req.key, apiRes);
        try {
            openOrderResults[req.key] = apiRes;
        } catch (error) {
            console.log(error);
            console.log(apiRes);
        }
    }));

    openOrderResults.bisq = {};
    // console.log(openOrderResults);
    return openOrderResults;
}

const cancelOrder = async (order, credSet, cb) => {
    let req;
    let lookupKey = config.credSet[credSet] || 'not found';
    if (lookupKey === 'not found') {
        cb('not found');
        return;
    }
    switch (order.exchange) {
        case 'coinfloor':
            let coinfloor_headers = { 'Authorization': 'Basic ' + Buffer.from(config.credential[lookupKey.coinfloor].userid + '/' + config.credential[lookupKey.coinfloor].apikey + ":" + config.credential[lookupKey.coinfloor].password).toString('base64') };
            const { URLSearchParams } = require('url');
            const cf_params = new URLSearchParams();
            cf_params.append('id', order.id);
            req = {
                url: 'https://webapi.coinfloor.co.uk/bist/XBT/GBP/cancel_order/',
                method: 'POST',
                headers: coinfloor_headers,
                body: cf_params,
                key: 'coinfloor',
            }
            break;
        case 'coinbase':
            const coinbase_cred = lookupKey.coinbase;
            const coinbase_timestamp = Date.now() / 1000;
            req = {
                url: config.credential[coinbase_cred].apiURL + '/orders/' + order.id,
                method: 'DELETE',
                headers: {
                    'CB-ACCESS-KEY': config.credential[coinbase_cred].apikey,
                    'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'DELETE', '/orders/' + order.id, "", config.credential[coinbase_cred].base64secret),
                    'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
                    'CB-ACCESS-PASSPHRASE': config.credential[coinbase_cred].passphrase,
                    'Content-Type': 'application/json'
                },
                body: null,
                key: 'coinbase',
            }
            break;
        case 'kraken':
            const kraken_cred = lookupKey.kraken;
            const kraken_burl = 'https://api.kraken.com';
            const kraken_path = '/0/private/CancelOrder';
            const nonce = new Date() * 1000;
            const requestData = {
                txid: order.id,
                nonce: nonce
            };
            const signature = krakenSignature(kraken_path, JSON.stringify(requestData), config.credential[kraken_cred].private_key, nonce);
            req = {
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
            break;
        case 'binance':
            const binance_cred = lookupKey.binance;
            const binance_burl = 'https://api.binance.com';
            const binance_endpoint = '/api/v3/order';
            const binance_dataQueryString = 'recvWindow=20000&timestamp=' + Date.now() + '&symbol=' + order.symbol + '&orderId=' + order.id;
            req = {
                url: binance_burl + binance_endpoint + '?' + binance_dataQueryString + '&signature=' + binanceSignature(binance_dataQueryString, config.credential[binance_cred]),
                method: 'DELETE',
                headers: {
                    'X-MBX-APIKEY': config.credential[binance_cred].apiKey
                },
                body: null
            }
            break;
        case 'cex':
            break;
    }
    let apiRes = await apiRequest(req.url, req.method, req.headers, req.body);
    cb({ [req.key]: apiRes });
}

const request = async (credSet, callback) => {
    let openOrders = await batchOpenOrdersRequest(credSet);
    callback(openOrders);
}

module.exports = { request, batchOpenOrdersRequest, cancelOrder };

const prototype_mode = process.argv[2] || false;

if (prototype_mode == "true") {
    request('bsArb', (openOrders) => {
        const fs = require('fs');
        let tmstmp_currentSys = new Date();
        let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);
        fs.writeFile('./log/openOrdersData' + tmstmp_currentSysDate + '.json', JSON.stringify(openOrders), (err) => {
            if (err) {
                console.log('Error occured when writing to file', { tmstmp_currentSys, err });
            }
        });
        //console.log(openOrders);
    });
    let order = {
        symbol: 'BTCEUR', //required for binance
        id: '24304636',
        exchange: 'binance'
    };
    // cancelOrder(order, config.thisCredSet, (res) => {
    //     console.log(res);
    // });
}
