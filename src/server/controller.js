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


const cmp = (a, b) => {
    if (a > b) return +1;
    if (a < b) return -1;
    return 0;
}

const sortArbitrageObjs = (arbitrageObjs) => {
    return arbitrageObjs.sort((a, b) => {
        return cmp(b.refValue, a.refValue) || cmp(b.price.slice(-1)[0], a.price.slice(-1)[0]);
    });
}

let sortedArbitrageObjs = [];

const masterController = async (testMode) => {

    // pre-load balance and exchange data
    let balanceData = testMode ? require('./log/balanceDataTest.json') : await balanceRequest.batchApiBalanceRequest();
    // console.log(balanceData);
    let exchangeData = await exchangeInfo.batchExchangeInfoRequest();
    // console.log(exchangeData);

    // price data streams (init + continuous)
    priceStream.updateProductProps(balanceData, exchangeData);
    priceStream.masterStream();

    let cooldown = cdThreshold;
    let toRunOp = true;

    setInterval(() => {

        let tmstmp_currentSys = new Date();
        let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);
        let filteredArbitrageObjs = [];
        // route calc function input priceStream.priceData output arbitrageObjs +ve only
        // console.log(priceStream.priceData);
        // console.time('routecalc');
        let arbitrageObjs = routeCalculator.calculateNetValue(priceStream.priceData);
        // console.log(tmstmp_currentSys, arbitrageObjs.length);

        sortedArbitrageObjs = sortArbitrageObjs(arbitrageObjs);

        for (arbObj of sortedArbitrageObjs) {
            if (arbObj.price.slice(-1)[0] > 1.001) {
                filteredArbitrageObjs.push(arbObj);
                fs.appendFile('./log/opportunity-' + tmstmp_currentSysDate + '.json', JSON.stringify(arbObj) + '\n', (err) => {
                    if (err) {
                        console.log('Error occured when writing to opportunity log', { tmstmp_currentSys, err });
                    }
                });
            }
        }

        // console.timeEnd('routecalc');

        if (filteredArbitrageObjs.length > 0) {

            // execute process via callback to avoid clogging up controller
            if (toRunOp && (cooldown <= 0)) {
                toRunOp = false;
                console.log('processing sorted opportunities')
                oppsProcessor.digest(sortedArbitrageObjs, balanceData, exchangeData, testMode, async (verifyOutput, tradeRes, id) => {
                    //eachOp
                    if (verifyOutput)
                        fs.appendFile('./log/validation-' + tmstmp_currentSysDate + '.json', JSON.stringify(verifyOutput) + '\n', (err) => {
                            if (err) { console.log('Error occured when writing to validation log', { tmstmp_currentSys, err }); }
                        });
                    console.log(`processed opportunity id ${id}`);
                    if (tradeRes) { // to use tradeRes.tradeExecuted
                        balanceData = await balanceRequest.batchApiBalanceRequest();
                        tradeRes.balancePost = balanceData;
                        fs.appendFile('./log/execution-' + tmstmp_currentSysDate + '.json', JSON.stringify(tradeRes) + '\n', (err) => {
                            if (err) { console.log('Error occured when writing to execution log', { tmstmp_currentSys, err }); }
                        });
                        priceStream.updateProductProps(balanceData, exchangeData);
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

const io = require('socket.io')();
const readline = require('readline');
io.on('connection', (client) => {

    let timer, streamTimer, snapshotTimer;
    console.log(`client id: ${client.id} connected`);

    client.on('subscribeToTimer', (interval) => {
        console.log('client is subscribing to timer with interval ', interval);
        timer = setInterval(() => {
            client.emit('timer', new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
        }, interval);
    });

    client.on('requestTradeLogs', (date) => {
        console.log('client is requesting data for:', date);
        let tradeLogs = [];
        let path = '../../../arbitorLog/tradeLog' + date + '.json';

        try {
            if (fs.existsSync(path)) {
                //file exists
                const readInterface = readline.createInterface({
                    input: fs.createReadStream('../../../arbitorLog/tradeLog' + date + '.json'),
                    //output: process.stdout,
                    console: false
                });

                readInterface.on('line', (line) => {
                    tradeLogs.push(JSON.parse(line))
                });

                readInterface.on('close', () => {
                    //console.log(tradeLogs);
                    client.emit('tradeLogs', { data: tradeLogs, error: false });
                })

            } else {
                console.log('no files found')
                client.emit('tradeLogs', { data: {}, error: 'no files found' });
            }
        } catch (err) {
            console.error(err)
            client.emit('tradeLogs', { data: {}, error: err });
        }
    });

    client.on('requestStreamData', (interval) => {
        console.log('client is subscribing to data stream with interval ', interval);
        streamTimer = setInterval(() => {
            client.emit('streamData', priceStream.streamData);
        }, interval);
    })

    client.on('cancelStreamData', () => {
        console.log('client has unsubscribed to data stream');
        clearInterval(timer);
    })

    client.on('requestBalanceData', (key) => {
        console.log('client requested balance');
        if (key === 'bs') {
            balanceRequest.request((balance) => {
                client.emit('balanceData', balance);
            });
        } else {
            let dummy = {
                'coinfloor': { 'GBP': 10 },
                'coinbase': { 'GBP': 10 },
                'binance': { 'GBP': 10 }
            }
            client.emit('balanceData', dummy);
        }

    })

    client.on('requestSnapshotData', (data) => {
        console.log('client requested snapshot data');
        snapshotTimer = setInterval(() => {
            client.emit('snapshotData', sortedArbitrageObjs.slice(0, data.size));
        }, data.interval);
    })

    client.on('cancelSnapshotData', () => {
        console.log('client has unsubscribed to snapshot data');
        clearInterval(snapshotTimer);
    })

    client.on('disconnect', (reason) => {
        clearInterval(timer);
        clearInterval(streamTimer);
        clearInterval(snapshotTimer);
        console.log(`client id: ${client.id} disconnected: ${reason}`)
    })
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);

const prototype_mode = process.argv[2] || false;
if (prototype_mode == 'test') console.log('prototype mode on...')
masterController(prototype_mode);
