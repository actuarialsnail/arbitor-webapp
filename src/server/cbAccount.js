const config = require('./config/config');
const fetch = require('node-fetch');
const crypto = require('crypto');

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

const cb_request_accounts = async () => {
    let credential = config.credential[config.credSet[config.thisCredSet].coinbase];
    const coinbase_url = credential.apiURL + '/accounts';
    let coinbase_timestamp = Date.now() / 1000;
    const coinbase_headers = {
        'CB-ACCESS-KEY': credential.apikey,
        'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'GET', '/accounts', "", credential.base64secret),
        'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
        'CB-ACCESS-PASSPHRASE': credential.passphrase
    }
    let accountRes = await apiRequest(
        coinbase_url,
        'get',
        coinbase_headers,
        null
    )
    console.log(accountRes);
}

const cb_request_ledger = async (accountID) => {
    let credential = config.credential[config.credSet[config.thisCredSet].coinbase];
    const coinbase_url = credential.apiURL + '/accounts/' + accountID + '/ledger';
    let coinbase_timestamp = Date.now() / 1000;
    const coinbase_headers = {
        'CB-ACCESS-KEY': credential.apikey,
        'CB-ACCESS-SIGN': coinbaseSignature(coinbase_timestamp, 'GET', '/accounts/' + accountID + '/ledger', "", credential.base64secret),
        'CB-ACCESS-TIMESTAMP': coinbase_timestamp,
        'CB-ACCESS-PASSPHRASE': credential.passphrase
    }
    let accountRes = await apiRequest(
        coinbase_url,
        'get',
        coinbase_headers,
        null
    )
    console.log(accountRes);
}

cb_request();