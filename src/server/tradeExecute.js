const executeTrade = async () => {
    let execute_output = {
        'type': 'execution'
    }
    let ts = new Date();

    //prepare the order array
    let order = this.tradeObj.route.map((val, index, arr) => {
        let param = {}
        param.exchange = val.split('-')[1];
        param.pair = this.tradeObj.tradeKey[index].split('-')[0];
        param.quantity_base = this.tradeObj.tradeSizeMax[index];
        param.buysell = this.tradeObj.tradeSide[index];
        return param;
    })

    execute_output['timestamp'] = ts.toISOString();
    execute_output['orderParams'] = order;

    let balancePriorTrade = await this.batchApiBalanceRequest();
    let balancePriorTradeFiltered = this.balanceObjFilter(balancePriorTrade);
    execute_output['balancePrior'] = balancePriorTradeFiltered;

    // set up base inputs required for promise Arr
    // set up promise Arr based on optimised size management
    let promiseArr = order.map((val, index, arr) => {
        let param = {}
        param.key = val.exchange;
        let p1, p2;
        switch (val.exchange) {
            case 'coinfloor':
                let coinfloor_endpoint = 'https://webapi.coinfloor.co.uk/bist/';
                p1 = (val.pair.slice(0, 3) == 'BTC' ? 'XBT' : val.pair.slice(0, 3));
                p2 = val.pair.slice(3, 6);
                coinfloor_endpoint += p1 + '/' + p2 + (val.buysell == 'buy' ? '/buy_market/' : '/sell_market/');

                const coinfloor_headers = new Headers();
                if (this.trade_sandbox) {
                    coinfloor_headers.set('Authorization', 'Basic ' + Buffer.from(config.credential.coinfloor_sandbox.userid + '/' + config.credential.coinfloor_sandbox.apikey + ":" + config.credential.coinfloor_sandbox.password).toString('base64'));
                } else {
                    coinfloor_headers.set('Authorization', 'Basic ' + Buffer.from(config.credential.coinfloor.userid + '/' + config.credential.coinfloor.apikey + ":" + config.credential.coinfloor.password).toString('base64'));
                }
                const { URLSearchParams } = require('url');
                const cf_params = new URLSearchParams();
                cf_params.append('quantity', 1);
                // cf_params.append('amount', 1);
                // cf_params.append('price', 1);

                param.url = coinfloor_endpoint;
                param.method = 'POST';
                param.headers = coinfloor_headers;
                param.body = cf_params;
                break;

            case 'coinbase':
                const cb_private_url = (this.trade_sandbox ? 'https://api-public.sandbox.pro.coinbase.com/orders' : 'https://api.pro.coinbase.com/orders');
                const coinbase_headers = new Headers();
                let timestamp = Date.now() / 1000;
                p1 = (val.pair.slice(0, 3));
                p2 = val.pair.slice(3, 6);
                const coinbase_body = {
                    size: val.quantity_base,
                    type: 'market',
                    side: val.buysell,
                    product_id: p1 + '-' + p2
                }
                coinbase_headers.set('CB-ACCESS-KEY', this.trade_sandbox ? config.credential.coinbase_sandbox.apikey : config.credential.coinbase.apikey);
                coinbase_headers.set('CB-ACCESS-SIGN', this.coinbaseSignature(timestamp, 'POST', '/orders', JSON.stringify(coinbase_body), this.trade_sandbox ? config.credential.coinbase_sandbox.base64secret : config.credential.coinbase.base64secret));
                coinbase_headers.set('CB-ACCESS-TIMESTAMP', timestamp);
                coinbase_headers.set('CB-ACCESS-PASSPHRASE', this.trade_sandbox ? config.credential.coinbase_sandbox.passphrase : config.credential.coinbase.passphrase);
                coinbase_headers.set('Content-Type', 'application/json');

                param.url = cb_private_url;
                param.method = 'POST';
                param.headers = coinbase_headers;
                param.body = JSON.stringify(coinbase_body);
                break;

            case 'binance':
                let binance_burl = 'https://api.binance.com';
                let binance_endpoint = (this.trade_sandbox ? '/api/v3/order/test' : '/api/v3/order');

                let binance_headers = new Headers();
                binance_headers.set('X-MBX-APIKEY', config.credential.binance.apiKey);

                let binance_dataQueryString = 'recvWindow=20000&timestamp=' + Date.now() + '&symbol=' + val.pair + '&side=' + val.buysell + '&type=market&quantity=' + val.quantity_base;
                param.url = binance_burl + binance_endpoint + '?' + binance_dataQueryString + '&signature=' + this.binanceSignature(binance_dataQueryString, config.credential.binance);
                param.method = 'POST';
                param.headers = binance_headers;
                param.body = null;
                break;

            case 'kraken':
                let kraken_burl = 'https://api.kraken.com';
                let kraken_path = '/0/private/AddOrder';
                let nonce = new Date() * 1000;
                let requestData = {
                    pair: krakenMap[val.pair],
                    type: val.buysell,
                    ordertype: 'market',
                    volume: val.quantity_base,
                    nonce: nonce,
                    validate: this.trade_sandbox,
                };

                param.url = kraken_burl + kraken_path;
                param.method = 'POST';
                param.body = JSON.stringify(requestData);

                let signature = this.krakenSignature(kraken_path, requestData, config.credential.kraken.private_key, nonce);
                let kraken_headers = new Headers();
                kraken_headers.set('User-Agent', 'Kraken Javascript API Client');
                kraken_headers.set('API-Key', config.credential.kraken.api);
                kraken_headers.set('API-Sign', signature);
                kraken_headers.set('Content-type', 'application/json');
                param.headers = kraken_headers;
                break;

            case 'cex':

                break;

            default:
                break;
        }
        //this.log(param);
        return param;
    });

    let tradeRes = await this.batchApiOrderExecuteRequest(promiseArr);
    execute_output['tradeRes'] = tradeRes

    let balancePostTrade = await this.batchApiBalanceRequest();
    let balancePostTradeFiltered = this.balanceObjFilter(balancePostTrade);
    execute_output['balancePost'] = balancePostTradeFiltered;

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
        //this.log(response);
        const json = await response.json();
        //this.log(json)
        return json;
    } catch (error) {
        let time = Date();
        this.log(JSON.stringify({ time, location: 'apiRequest', error, catch_res }, null, 4));
        return (error);
    }
}

const batchApiOrderExecuteRequest = async (promiseArr) => {
    let orderExecuteRes = [];
    orderExecuteRes = await Promise.all(promiseArr.map(async (req, index, arr) => {
        let apiRes = await this.apiRequest(req.url, req.method, req.headers, req.body);
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