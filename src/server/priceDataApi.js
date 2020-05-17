const fetch = require('node-fetch');

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

const apiRequest = async (url, method, headers, body) => {
    let catch_res;
    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body
        });
        catch_res = response;
        //console.log(response);
        const json = await response.json();
        //console.log(json)
        return json;
    } catch (error) {
        let time = Date();
        console.log(JSON.stringify({ time, location: 'apiRequest', error, catch_res }, null, 4));
        return ({error});
    }
}

const batchApiOrderbookRequest = async (promiseArr) => {

    let priceResults = {};
    let hasIssues = false;
    await Promise.all(promiseArr.map(async (req, index, arr) => {
        // console.time(req.key)
        let apiRes = await apiRequest(req.url, req.method, req.headers, req.body);
        if (req.key.split('-')[2] == 'kraken' && apiRes.error.length == 0){
            apiRes.error = null;
        }
        if (apiRes.error){
            console.log(req.key, 'response error occured');
            hasIssues = true;
        } else {
            priceResults[req.key] = {};
            console.log(req.key, 'completed');
            if (req.key.split('-')[2] == 'binance') {
                priceResults[req.key].bid = [apiRes.bidPrice, apiRes.bidQty];
                priceResults[req.key].ask = [apiRes.askPrice, apiRes.askQty];
            } else
                if (req.key.split('-')[2] == 'kraken') {
                    //console.log(apiRes);
                    let ref = krakenMap[req.key.split('-')[0] + '-' + req.key.split('-')[1]];
                    let lookup = apiRes.result[ref];
                    priceResults[req.key].bid = [lookup.bids[0][0], lookup.bids[0][1]];
                    priceResults[req.key].ask = [lookup.asks[0][0], lookup.asks[0][1]];
                }
                else {
                    priceResults[req.key].bid = apiRes.bids[0];
                    priceResults[req.key].ask = apiRes.asks[0];
                }
        }
        // console.timeEnd(req.key)
    }));
    // console.log(priceResults);
    return hasIssues? null : priceResults;
}

const mappingRouteEndpointOrderbook = (key) => {
    let [s1, s2, exchange] = key.split('-');
    let endpoint, p1, p2 = '';
    switch (exchange) {
        case 'coinfloor':
            endpoint = 'https://webapi.coinfloor.co.uk/bist/';
            p1 = (s1 == 'BTC' ? 'XBT' : s1);
            p2 = s2;
            endpoint += p1 + '/' + p2 + '/order_book/';
            break;
        case 'coinbase':
            endpoint = 'https://api.pro.coinbase.com/';
            p1 = s1;
            p2 = s2;
            endpoint += '/products/' + p1 + '-' + p2 + '/book';
            break;
        case 'binance':
            endpoint = 'https://api.binance.com/api/v3/ticker/bookTicker?symbol=' + s1 + s2;
            break;
        case 'kraken':
            endpoint = 'https://api.kraken.com/0/public/Depth?pair='
            p1 = (s1 == 'BTC' ? 'XBT' : s1);
            p2 = (s2 == 'BTC' ? 'XBT' : s2);
            endpoint += p1 + p2 + '&count=1';
            break;
        case 'cex':
            endpoint = 'https://cex.io/api/order_book/'
            p1 = s1;
            p2 = s2;
            endpoint += p1 + '/' + p2;
            break;
        default:
            console.log('unknown exchange');
            break;
    }
    return endpoint;
}

const batchPriceDataApiRequest = async (tradeKey) => {

    let promiseArr = [];
    tradeKey.forEach(key => {
        promiseArr.push({
            url: mappingRouteEndpointOrderbook(key),
            method: 'GET',
            header: null,
            body: null,
            key: key
        })
    })
    let orderbookResults = await batchApiOrderbookRequest(promiseArr);
    return orderbookResults;
}

const request = async (tradeKey, callback) => {
    let priceData = await batchPriceDataApiRequest(tradeKey);
    callback(priceData);
}

module.exports = { request, batchPriceDataApiRequest };

// 
// console.time('start');
// const tradeKey = [
//     "BTC-EUR-kraken",
//     "BCH-EUR-coinbase",
//     "BCH-BTC-binance"
// ];
// request(tradeKey, (priceData) => {
//     console.log(priceData);
//     console.timeEnd('start');
// }) 