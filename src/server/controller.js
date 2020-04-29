// price data streams (init + continuous)
const priceDataStream = require('./priceDataStream');
const priceStream = new priceDataStream();


// route calculate (timer)
const routeCalculator = require('./routeCalculate');

// log (timer)
const fs = require('fs');
// const mailer = require('./mailer');

// balance info (init + adhoc)
const balanceRequest = require('./balanceRequest');

// exchange info (init + adhoc)
const exchangeInfo = require('./exchangeInfo');

const oppsProcessor = require('./oppsProcessor');



const interval = 1000;
const cdThreshold = 60; // seconds


const sortArbitrageObjs = (arbitrageObjs) => {
    return arbitrageObjs.sort((a, b) => {
        return b['refValue'] - a['refValue'];
    });
}

const masterController = async () => {

    // pre-load balance and exchange data
    let balanceData = await balanceRequest.batchApiBalanceRequest();
    // console.log(balanceData);
    let exchangeData = await exchangeInfo.batchExchangeInfoRequest();
    // console.log(exchangeData);

    // price data streams (init + continuous)
    priceStream.updateProductProps(balanceData, exchangeData);
    priceStream.masterStream();

    //TODO: add ability to update balance data into pricestream for easier route calc

    // timer (
    //  route calc return 1+
    //  log all async ...array
    //  sort by refMult
    //  loop through sorted and filtered, if above trade threshold
    //          (1. cooldown, 2. await requset pricedata restful API
    //           3. validate, if validate true call tradeExecutor and break loop)
    //  
    //  nodemailer analysis
    // )

    let cooldown = cdThreshold;
    let toRunOp = true;

    setInterval(() => {

        let tmstmp_currentSys = new Date();
        let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);

        // route calc function input priceStream.priceData output arbitrageObjs +ve only
        // console.log(priceStream.priceData);
        // console.time('routecalc');
        let arbitrageObjs = routeCalculator.calculateNetValue(priceStream.priceData);
        // console.log(tmstmp_currentSys, arbitrageObjs.length);
        // console.timeEnd('routecalc');

        if (arbitrageObjs.length > 0) {
            for (arbObj of arbitrageObjs) {
                fs.appendFile('./log/opportunity-' + tmstmp_currentSysDate + '.json', JSON.stringify(arbObj) + '\n', (err) => {
                    if (err) {
                        console.log('Error occured when writing to opportunity log', { tmstmp_currentSys, err });
                    }
                });
            }

            let sortedArbitrageObjs = sortArbitrageObjs(arbitrageObjs);

            // execute process via callback to avoid clogging up controller
            if (toRunOp && (cooldown <= 0)) {
                toRunOp = false;
                console.log('processing sorted opportunities')
                oppsProcessor.digest(sortedArbitrageObjs, balanceData, exchangeData, async (verifyOutput, tradeRes, id) => {
                    //eachOp
                    if (verifyOutput)
                        fs.appendFile('./log/validation-' + tmstmp_currentSysDate + '.json', JSON.stringify(verifyOutput) + '\n', (err) => {
                            if (err) { console.log('Error occured when writing to validation log', { tmstmp_currentSys, err }); }
                        });
                    if (tradeRes)
                        fs.appendFile('./log/execution-' + tmstmp_currentSysDate + '.json', JSON.stringify(tradeRes) + '\n', (err) => {
                            if (err) { console.log('Error occured when writing to execution log', { tmstmp_currentSys, err }); }
                        });
                    console.log(`processed opportunity id ${id}`);
                    if (tradeRes) { // to use tradeRes.tradeExecuted
                        balanceData = await balanceRequest.batchApiBalanceRequest();
                        cooldown = cdThreshold;
                    };
                }, () => { toRunOp = true; }) //endOp
            }
            if (cooldown > 0) { console.log(`sorted arb objects ready but opps processor in ${cooldown}s cooldown`) }
            if (!toRunOp) { console.log('sorted arb objects ready but opps processor still busy...') }
        }
        cooldown--;
        // mailer(tmstmp_currentSys); //use time to build balance historical data
    }, interval)
}

module.exports = { masterController };

masterController();