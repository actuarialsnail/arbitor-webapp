const fetch = require('node-fetch');
const crypto = require('crypto');

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

const cexSignature = () => {

}

const coinfloorSignature = () => {

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
        catch_res = response;
        const json = await response.json();
        //console.log(json)
        return json;
    } catch (error) {
        let time = Date();
        console.log(JSON.stringify({ time, location: 'apiRequest', error, catch_res }, null, 4)); // add source of calling function
        return (error);
    }
}

module.exports = {
    coinfloorSignature, binanceSignature, coinbaseSignature, krakenSignature, cexSignature, apiRequest
};