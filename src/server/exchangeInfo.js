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
    'EUR-GBP': 'EURGBP'
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
        return (error);
    }
}

const batchExchangeInfoRequest = async () => {
    let exchangeInfo = {
        coinfloor: { tradeFee: 0.003 },
        coinbase: { tradeFee: 0.005 },
        kraken: { tradeFee: 0.0026 },
        binance: { tradeFee: 0.001 },
        cex: { tradeFee: 0.0025 },
        bisq: { tredeFee: 0.01 },
        binanceJe: { tradeFee: 0.001 },
    };

    // coinfloor
    // exchangeInfo.coinfloor = {}
    let coinfloor = {
        minSize: {
            'BTC-GBP': 0.0001,
            // 'ETH-GBP': 0.0001,
        },
        maxSize: {
            'BTC-GBP': 1000,
            // 'ETH-GBP': 1000,
        },
        stepSize: {
            'BTC-GBP': 3,
            // 'ETH-GBP': 3,
        },
        minAmt: {
            'BTC-GBP': 1,
            // 'ETH-GBP': 1,
        },
        maxAmt: {
            'BTC-GBP': 5000,
            // 'ETH-GBP': 1000,
        },
        stepAmt: {
            'BTC-GBP': 0,
            // 'ETH-GBP': 0,
        }
    }
    exchangeInfo.coinfloor = { ...coinfloor, ...exchangeInfo.coinfloor };

    // coinbase
    // exchangeInfo.coinbase = {};
    let coinbase = {};
    let coinbaseInfoUrl = 'https://api.pro.coinbase.com/products';
    let coinbaseRes = await apiRequest(coinbaseInfoUrl, 'GET', null, null);
    coinbase.minSize = {};
    coinbase.maxSize = {};
    coinbase.stepSize = {};
    // coinbase.minAmt = {};
    // coinbase.maxAmt = {};
    // coinbase.stepAmt = {};
    coinbaseRes.forEach(element => {
        key = element.base_currency + '-' + element.quote_currency;
        coinbase.minSize[key] = Number(element.base_min_size);
        coinbase.maxSize[key] = Number(element.base_max_size);
        coinbase.stepSize[key] = Math.max(element.base_increment.indexOf('1') - 1, 0);
        // note that the price lmits (quote_increment) are for limit orders, market orders take size or funds as parameters
        // coinbase.stepAmt[key] = Math.max(element.quote_increment.indexOf('1') - 1, 0);
    });
    exchangeInfo.coinbase = { ...coinbase, ...exchangeInfo.coinbase };

    // kraken
    // exchangeInfo.kraken = {}
    let kraken = {};
    // Should be monitored through here: https://support.kraken.com/hc/en-us/articles/205893708-What-is-the-minimum-order-size-
    const minSize = {
        'BTC-GBP': 0.002,
        'ETH-GBP': 0.02,
        'BTC-EUR': 0.002,
        'ETH-EUR': 0.02,
        'BCH-EUR': 0.002,
        'LTC-EUR': 0.1,
        'BCH-BTC': 0.002,
        'ETH-BTC': 0.02,
        'LTC-BTC': 0.1,
        'BAT-BTC': 50,
        'BAT-ETH': 50,
        'BAT-EUR': 50,
        'XRP-BTC': 30,
        'XRP-EUR': 30,
        'EUR-GBP': 10,
    };
    const minAmt = {
        'BTC-GBP': 10,
        'ETH-GBP': 10,
        'BTC-EUR': 10,
        'ETH-EUR': 10,
        'BCH-EUR': 10,
        'LTC-EUR': 10,
        'BCH-BTC': 0.002,
        'ETH-BTC': 0.002,
        'LTC-BTC': 0.002,
        'BAT-BTC': 0.002,
        'BAT-ETH': 0.02,
        'BAT-EUR': 10,
        'XRP-BTC': 0.002,
        'XRP-EUR': 10,
        'EUR-GBP': 10,
    }
    let krakenInfoUrl = 'https://api.kraken.com/0/public/AssetPairs';
    let krakenRes = await apiRequest(krakenInfoUrl, 'GET', null, null);
    kraken.minSize = {};
    kraken.maxSize = {};
    kraken.stepSize = {};
    kraken.minAmt = {};
    kraken.maxAmt = {};
    kraken.stepAmt = {};
    Object.keys(krakenMap).forEach(pair => {
        kraken.minSize[pair] = minSize[pair];
        kraken.maxSize[pair] = minSize[pair] * 100000; //simple assumption
        kraken.minAmt[pair] = minAmt[pair];
        kraken.maxAmt[pair] = minAmt[pair] * 100000; //simple assumption
        if (krakenRes.result.hasOwnProperty(krakenMap[pair])) {
            kraken.stepSize[pair] = krakenRes.result[krakenMap[pair]].lot_decimals;
            kraken.stepAmt[pair] = krakenRes.result[krakenMap[pair]].pair_decimals;
        }
    })
    exchangeInfo.kraken = { ...kraken, ...exchangeInfo.kraken };

    // binance
    // exchangeInfo.binance = {};
    let binance = {};
    let binanceInfoUrl = 'https://api.binance.com/api/v1/exchangeInfo';
    let binanceRes = await apiRequest(binanceInfoUrl, 'GET', null, null);

    binance.minSize = {};
    binance.maxSize = {};
    binance.stepSize = {};
    binance.minAmt = {};
    binance.maxAmt = {};
    binance.stepAmt = {};

    binanceRes.symbols.forEach(element => {
        let symbol = element.baseAsset + '-' + element.quoteAsset;
        element.filters.forEach(filt => {
            if (filt.filterType == 'LOT_SIZE') {
                binance.stepSize[symbol] = Math.max(filt.stepSize.indexOf('1') - 1, 0);
                binance.minSize[symbol] = Number(filt.minQty);
                binance.maxSize[symbol] = Number(filt.maxQty);
            }
            if (filt.filterType == 'MIN_NOTIONAL') {
                binance.minAmt[symbol] = filt.minNotional;
                binance.maxAmt[symbol] = filt.minNotional * 100000; //simple assumption
            }
            // note that the min and max price filter is not relevant for market orders but assume the same increment
            if (filt.filterType == 'PRICE_FILTER') {
                binance.stepAmt[symbol] = Math.max(filt.tickSize.indexOf('1') - 1, 0);
            }
        })
    });
    exchangeInfo.binance = { ...binance, ...exchangeInfo.binance };

    // cex
    exchangeInfo.cex = {};
    let cex = {};
    const cex_precision = {
        BTC: 8,
        ETH: 6,
        BCH: 8,
        LTC: 8,
        XRP: 6,
        BAT: 6,
        GBP: 2,
        EUR: 2,
    }
    let cexInfoUrl = 'https://cex.io/api/currency_limits';
    let cexRes = await apiRequest(cexInfoUrl, 'GET', null, null);

    cex.minSize = {};
    cex.maxSize = {};
    cex.stepSize = {};
    cex.minAmt = {};
    cex.maxAmt = {};
    cex.stepAmt = {};

    cexRes.data.pairs.forEach(pair => {
        let symbol = pair.symbol1 + '-' + pair.symbol2
        cex.minSize[symbol] = pair.minLotSize;
        cex.maxSize[symbol] = pair.minLotSize * 1000000;
        cex.stepSize[symbol] = cex_precision[pair.symbol1];
        cex.minAmt[symbol] = pair.minLotSizeS2;
        cex.maxAmt[symbol] = pair.minLotSizeS2 * 1000000;
        cex.stepAmt[symbol] = cex_precision[pair.symbol2];
    })
    exchangeInfo.cex = { ...cex, ...exchangeInfo.cex };

    return exchangeInfo;
}

const request = async (callback) => {
    let exchangeInfo = await batchExchangeInfoRequest();
    callback(exchangeInfo);
}

module.exports = { request, batchExchangeInfoRequest };

const prototype_mode = process.argv[2] || false;

if (prototype_mode == 'true') {
    console.log('exchange info request prototype mode on...')
    request((exchangeData) => {
        const fs = require('fs');
        let tmstmp_currentSys = new Date();
        let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);
        fs.writeFile('./log/exchangeData' + tmstmp_currentSysDate + '.json', JSON.stringify(exchangeData), (err) => {
            if (err) {
                console.log('Error occured when writing to file', { tmstmp_currentSys, err });
            }
        });
        //console.log(exchangeData);
    });
}
