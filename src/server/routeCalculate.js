const { symbols, exchanges, refMultMap } = require('./config/scope');

const expandPermute = (arr) => {
    let result = [];
    arr.forEach((i, idx, array) => {
        let curr = permutator(i);
        result = result.concat(curr);
    });

    return result;
}

const permutator = (inputArr) => {
    let result = [];
    const permute = (arr, m = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }
    permute(inputArr)
    return result;
}

const numberHopsFilter = (arr) => {
    const minNoHops = 1;
    const maxNoHops = 3;
    let result = [];
    arr.forEach((i, idx, array) => {
        if (i.length > minNoHops && i.length <= maxNoHops) {
            result.push(i);
        }
    })
    return result;
}

const getAllSubsets = theArray => theArray.reduce(
    (subsets, value) => subsets.concat(
        subsets.map(set => [value, ...set])
    ),
    [[]]
);

const symbolSets = expandPermute(numberHopsFilter(getAllSubsets(symbols)));

const generateRoutes = (symbols, exchanges, N, array = []) => {
    if (N == 0) {
        return array;
    } //final matrix

    const hops = symbols.length;
    let combined = [];
    const index = (N == 1) ? 0 : hops - N + 1;
    //console.log(symbols[hops-N],symbols[index]);

    for (let e in exchanges) {
        const eName = exchanges[e];
        const ePair = symbols[hops - N] + '-' + symbols[index];
        if (N == hops) {
            combined.push([ePair + '-' + eName]);
        } else {
            for (let i in array) {
                let temp = array[i].slice(); //shallow copy required
                temp.push(ePair + '-' + eName);
                combined.push(temp);
            }
        }
    }
    return generateRoutes(symbols, exchanges, N - 1, combined);
};

let routes = [];
symbolSets.forEach(set => {
    routes.push(...generateRoutes(set, exchanges, set.length));
});

const autoRebal = false;
const strictTmstmpInd = true;
const strictTmstmpLimit = 5 * 60 * 1e3; // n * seconds
const showProfitOnly = true;
const minMonitoringLevel = 0.99;

const calculateNetValue = (priceData) => {

    const tmStmpSystem = Date.now();
    let arbitrageObjs = [];
    // console.log('route length', routes.length);
    for (let route of routes) {
        let hasPrice = true;
        let netValue = 1;
        let priceArr = [];
        let tradeFeeArr = [], tradeSideArr = [], tradeKeyArr = [], timestampArr = [];
        // let depositFeeArr = [], withdrawalFeeArr = [];
        //console.log(priceData);
        for (let hop of route) {
            // const [symbol1, symbol2, exchange] = hop.split('-');
            // const depositFeeInd = autoRebal ? 1 : 0;
            // const withdrawalFeeInd = autoRebal;

            if (!hasPrice) break;
            if (!priceData.hasOwnProperty(hop)) {
                // console.log('break');
                hasPrice = false; break;
            } else {
                // console.log('property found');
            }
            // const { price, tradeFee, depositFee, withdrawalFee, tradeSide, tradeKey, timestamp } = priceData[hop];
            const { price, tradeFee, tradeSide, tradeKey, timestamp } = priceData[hop];

            if (strictTmstmpInd && (tmStmpSystem - timestamp > strictTmstmpLimit)) {
                // console.log(`${tmStmpSystem} ${hop} price stream/data time ${timestamp} is stale`);
                hasPrice = false; break;
            }//stale priceData

            priceArr.push(price); tradeFeeArr.push(tradeFee); tradeSideArr.push(tradeSide); tradeKeyArr.push(tradeKey); timestampArr.push(timestamp);
            // depositFeeArr.push(depositFee); withdrawalFeeArr.push(withdrawalFee); 

            // if (autoRebal) {
            //     // deposit and withdrawaml fees (add and mult) are zero if pre/proceeding exhcanges are the same respecively
            // }

            // netValue = ((netValue - depositFee.add * depositFeeInd) * (1 - depositFee.pc * depositFeeInd) * price * (1 - tradeFee) * (1 - withdrawalFee.pc * withdrawalFeeInd)) - withdrawalFee.add * withdrawalFeeInd;
            netValue = netValue * price * (1 - tradeFee);
        }  // for each hop
        // if (hasPrice) {
        // console.log(`${route} has price`);
        // console.log(netValue);
        // }
        priceArr.push(netValue);
        timestampArr.push(tmStmpSystem);

        if (hasPrice && netValue > minMonitoringLevel) {
            let mktSizeArr, accSizeArr;
            if (netValue > showProfitOnly ? 1.001 : -100) {
                mktSizeArr = calculateSize(route, priceData, "market");
                accSizeArr = calculateSize(route, priceData, "account");
            } else {
                mktSizeArr = priceData.mktSize;
                accSizeArr = priceData.accSize;
            }
            const startSize = Math.min(mktSizeArr.slice(-1)[0], accSizeArr.slice(-1)[0]);
            const startCurrency = refMultMap[route[0].split('-')[0]];
            const refMult = startCurrency == 'reference' ? 1 : priceData[startCurrency] != undefined ? priceData[startCurrency].price : -1;
            const refValue = (netValue - 1) * startSize * refMult;
            // arbitrageObjs.push({ route, price: priceArr, mktSize: mktSizeArr, accSize: accSizeArr, timestamp: timestampArr, tradeFee: tradeFeeArr, depositFee: depositFeeArr, withdrawalFee: withdrawalFeeArr, tradeSide: tradeSideArr, tradeKey: tradeKeyArr, refMult, refValue });
            arbitrageObjs.push({ route, price: priceArr, mktSize: mktSizeArr, accSize: accSizeArr, timestamp: timestampArr, tradeFee: tradeFeeArr, tradeSide: tradeSideArr, tradeKey: tradeKeyArr, refMult, refValue });
        }
    } // for each route

    return arbitrageObjs;
}

const calculateSize = (route, priceData, type) => {
    //console.log(`calculateSize: ${route}`);
    const sizeType = (type == "market") ? 'mktSize' : 'accSize';
    let netSize = 1; // init relative scalar 1 = 100%
    let accPriceFactor = 1; //should result in same value as netValue
    let sizeArr = [];
    for (let hop in route) {
        let route_seg = route[hop];
        let size = priceData[route_seg][sizeType];
        let price = priceData[route_seg].price;
        let tradeFee = priceData[route_seg].tradeFee;
        sizeArr.push(size);
        if (hop == 0) {
            netSize = netSize * size * price * (1 - tradeFee);
        } else {
            netSize = Math.min(netSize, size) * price * (1 - tradeFee);
        }
        accPriceFactor = accPriceFactor * price * (1 - tradeFee);
    }
    netSize = netSize / accPriceFactor; //rebase size to starting value
    sizeArr.push(netSize);
    return sizeArr;
}

module.exports = { calculateNetValue, calculateSize };