const regVol = (price, size, pairKey, exchangeData) => {
    let [p1, p2, exchange] = pairKey.split('-');
    let pair = p1 + '-' + p2;
    if (exchangeData[exchange] == undefined) {
        console.log('undefined exchangeData');
        console.log(exchangeData);
    }

    //log(size+ ' '+ pairKey);
    let dec = exchangeData[exchange].stepSize[pair];
    let order_quantity = Math.floor(size * 10 ** dec) / (10 ** dec)
    if (order_quantity < exchangeData[exchange].minSize[pair]) {
        console.log(`${pairKey} order quantity ${order_quantity} below minSize ${exchangeData[exchange].minSize[pair]}`);
        order_quantity = 0;
    }
    if (order_quantity > exchangeData[exchange].maxSize[pair]) {
        console.log(`${pairKey} order quantity ${order_quantity} above maxSize ${exchangeData[exchange].maxSize[pair]}`);
        order_quantity = exchangeData[exchange].maxSize[pair];
    }
    if (exchangeData[exchange].minAmt != undefined) {
        let minAmt = exchangeData[exchange].minAmt[pair];
        if (order_quantity * price < minAmt) {
            console.log(`${pairKey} order quantity ${order_quantity} * ${price} below minAmt ${minAmt}`);
            order_quantity = 0;
        }
    }
    return order_quantity;
}

const valuePassThrough = (value, valueType, opportunity, priceApiData, balanceData, exchangeData) => {
    let resultsArray = opportunity.route.map((route, index) => {
        let [p_origin, p_target, exchange] = route.split('-');
        let pairKey = opportunity.tradeKey[index];
        let fee = opportunity.tradeFee[index];
        let bidask = (opportunity.tradeSide[index] == 'sell' ? 'bid' : 'ask');
        let price = priceApiData[pairKey][bidask][0];
        let volume = priceApiData[pairKey][bidask][1];
        let balance = balanceData[exchange][p_origin] || 0;

        // console.log('route : '+ route);
        // console.log('bidask : '+bidask+', fee : '+fee+', price : '+price+ ' '+ pairKey);
        let liquidity = (bidask == 'bid' ? volume : price * volume);
        if (index == 0 && valueType == 'relative') {
            value = value * balance;
        }

        // console.log('balance: '+balance+ ', liquidity: '+liquidity+', value: '+value+ ' '+ p_origin);
        value = Math.min(value, liquidity, balance);
        // console.log('minimum value starting '+value+' '+p_origin);

        let sv, ev, tradeQty;

        if (bidask == 'bid') { //e.g BTC-GBP
            sv = value;
            tradeQty = regVol(price, sv, pairKey, exchangeData);
            sv = tradeQty;
            ev = sv * price * (1 - fee);
        }

        if (bidask == 'ask') { //e.g GBP-BTC
            sv = value;
            ev = sv / price * (1 - fee);
            tradeQty = regVol(price, ev, pairKey, exchangeData);
            ev = tradeQty;
        }
        value = ev;
        // console.log('tradeQty: '+tradeQty+ ' ' + (bidask == 'bid'?p_origin:p_target));
        // console.log('value after trade '+ev+' '+p_target);
        // console.log('----------------');

        return { sv, ev, tradeQty };
    })
    return resultsArray;
}

const validate = (opportunity, priceApiData, balanceData, exchangeData) => {
    let ts = new Date();
    let verify_output = {
        'type': 'verification',
        'timestamp': ts.toISOString(),
        ...opportunity,
        priceApiData,
    };

    let vpt1Arr = valuePassThrough(1, 'relative', opportunity, priceApiData, balanceData, exchangeData);
    verify_output['verification1'] = vpt1Arr;
    console.log(vpt1Arr);
    let revisedVal = vpt1Arr.slice(-1)[0].ev / opportunity.price.slice(-1)[0]; //rebase to start size

    let vpt2Arr = valuePassThrough(revisedVal, 'absolute', opportunity, priceApiData, balanceData, exchangeData);
    verify_output['verification2'] = vpt2Arr;

    verify_output['tradeSizeMax'] = vpt2Arr.map(i => i.tradeQty);
    verify_output['status'] = (vpt2Arr.slice(-1)[0].ev > vpt2Arr[0].sv ? true : false);
    return verify_output;
}

module.exports = { validate };
