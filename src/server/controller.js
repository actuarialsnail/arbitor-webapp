// price data streams (init + continuous)
const priceDataStream = require('./priceDataStream');
const priceStream = new priceDataStream();
// price data restful (adhoc)
const priceDataApi = require('./priceDataApi');

// route calculate (timer)
const routeCalculator = require('./routeCalculate');

// log (timer)
const fs = require('fs');
// const mailer = require('./mailer');

// balance info (init + adhoc)
const balanceRequest = require('./balanceRequest');

// exchange info (init + adhoc)
const exchangeInfo = require('./exchangeInfo');

// trade validator and eExecutor (adhoc)
const tradeValidator = require('./tradeValidate');
const tradeExecutor = require('./tradeExecute');

const interval = 1000;
const cdThreshold = 30;

const masterController = async () => {

    // pre-load balance and exchange data
    let balanceData = await balanceRequest.batchApiBalanceRequest();
    // console.log(balanceData);
    let exchangeData = await exchangeInfo.batchExchangeInfoRequest();
    // console.log(exchangeData);


    // price data streams (init + continuous)
    priceStream.masterStream();

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

    setInterval(() => {

        let tmstmp_currentSys = new Date();
        let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);

        //route calc function input priceStream.priceData output arbitrageObjs +ve only
        //console.log(priceStream.priceData);
        // console.time('routecalc');
        let arbitrageObjs = routeCalculator.calculateNetValue(priceStream.priceData);
        // console.log(tmstmp_currentSys, arbitrageObjs.length);
        // console.timeEnd('routecalc');
        if (arbitrageObjs.length > 0) {
            fs.appendFile('./log/tradeLog' + tmstmp_currentSysDate + '.json', JSON.stringify(arbitrageObjs) + '\n', (err) => {
                if (err) {
                    console.log('Error occured when writing to tradelog', { tmstmp_currentSys, err });
                }
            });
            // sort it
            
        }
        

        // let sortedArbitrageObjs;
        // let restfulCheck = true;
        // sortedArbitrageObjs.forEach(item => {
        //     if (item.price.slice(-1)[0] > this.tradeTrigger && this.cooldown <= 0) {

        //         const priceApi = priceDataApi();
        //         if (restfulCheck) {
        //             // await request pricedata restful API
        //             priceApi = {};
        //             restfulCheck = false;
        //         }

        //         let isArbitrage = tradeValidator(item, priceApi, balanceData, exchangeData)
        //         // check if second validation passes

        //         // if passes
        //         if (isArbitrage) {
        //             let balanceData = await balanceRequest.batchApiBalanceRequest();
        //             // call tradeExecutor await
        //             cooldown = cdThreshold;
        //             await tradeExecutor();
        //             let balanceData = await balanceRequest.batchApiBalanceRequest();
        //         }
        //     }
        // });
        // cooldown--;
        // mailer(tmstmp_currentSys);
        
    }, interval)

}

module.exports = { masterController };

masterController();