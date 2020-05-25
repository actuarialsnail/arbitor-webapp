'use strict';
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

// price data streams (init + continuous)
const priceDataStream = require('./priceDataStream');
const priceStream = new priceDataStream();

// route calculate (timer)
const routeCalculator = require('./routeCalculate');

// log (timer)
const fs = require('fs');
const readline = require('readline');
// const mailer = require('./mailer');
const io = require('socket.io')();

// balance info (init + adhoc)
const config = require('./config/config');
const balanceRequest = require('./balanceRequest');
const tradeExecutor = require('./tradeExecute');

// exchange info (init + adhoc)
const exchangeInfo = require('./exchangeInfo');

const oppsProcessor = require('./oppsProcessor');

const workerMap = {
    'priceDataStream': 100,
    'routeCalculate': 101,
    'oppsProcessor': 102,
}

const jobMap = Object.assign({}, ...Object.entries(workerMap).map(([a, b]) => ({ [b]: a })));

if (cluster.isMaster) {
    console.log('Master process is running with pid:', process.pid);
    const clusterMap = {};
    const clusterMapReverse = {};
    let count = 0; // Used to avoid infinite loop

    let balanceData, exchangeData, streamData;
    const testMode = config.testMode;
    let sortedArbitrageObjs = [];

    for (let i = 0; i < numCPUs - 1; ++i) {
        const customId = i + 100;
        const worker = cluster.fork({ workerId: customId });
        clusterMap[worker.id] = customId;
        clusterMapReverse[customId] = worker.id;

        worker.send({ task: 'task', body: 'initiate' });

        worker.on('message', msg => {
            //console.log('Message from worker', clusterMap[worker.id], ':', msg.type);

            // One-off initialisation
            if (clusterMap[worker.id] === 100 && !count++) {
                // Message from master for worker 100 to do specific task with taskArg
                const init = async () => {
                    balanceData = await balanceRequest.batchApiBalanceRequest(config.thisCredSet);
                    exchangeData = await exchangeInfo.batchExchangeInfoRequest();
                    let priceDataStreamArgs = { task: 'priceDataStream', body: { balanceData, exchangeData } };
                    worker.send(priceDataStreamArgs);
                }
                init();
            }

            // set interval process cycle
            switch (msg.type) {
                case 'initiate':
                    //console.log('Worker', clusterMap[worker.id], 'initiated');
                    break;
                case 'priceDataStream':
                    //console.log('Received streamData... to routeCalculate');
                    let routeCalculateArg = { task: 'routeCalculate', body: { priceData: msg.res.priceData } };
                    cluster.workers[clusterMapReverse[workerMap.routeCalculate]].send(routeCalculateArg);
                    streamData = msg.res.streamData;
                    break;
                case 'routeCalculate':
                    //console.log('Received routeCalculate... to process opps');
                    let oppsProcessorArg = { task: 'oppsProcessor', body: { filteredArbitrageObjs: msg.res.filteredArbitrageObjs, balanceData, exchangeData, testMode } };
                    cluster.workers[clusterMapReverse[workerMap.oppsProcessor]].send(oppsProcessorArg);
                    sortedArbitrageObjs = msg.res.sortedArbitrageObjs;
                    break;
                case 'oppsProcessor':
                    if (msg.res.balanceData) {
                        let priceDataStreamArgs = { task: 'priceDataStreamUpdateProps', body: { balanceData, exchangeData } };
                        cluster.workers[clusterMapReverse[workerMap.priceDataStream]].send(priceDataStreamArgs);
                    }
                    break;
                default:
                    // default action
                    console.log('unknown msg.type');
                    break;
            }
        });
    }

    // websocket responsibility with master node
    io.on('connection', (client) => {
        let timer, streamTimer, snapshotTimer;
        console.log(`client id: ${client.id} connected`);

        client.on('subscribeToTimer', (interval) => {
            console.log('client is subscribing to timer with interval ', interval);
            timer = setInterval(() => {
                client.emit('timer', new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
            }, interval);
        });

        client.on('requestLogs', data => {
            console.log(`client is requesting ${data.type} data for: ${data.date}`);
            let logs = [];
            // let path = '../../../arbitorLog/tradeLog' + date + '.json';
            const path = './log/' + data.type + '-' + data.date + '.json';
            try {
                if (fs.existsSync(path)) {
                    //file exists
                    const readInterface = readline.createInterface({
                        input: fs.createReadStream(path),
                        //output: process.stdout,
                        console: false
                    });

                    readInterface.on('line', (line) => {
                        logs.push(JSON.parse(line))
                    });

                    readInterface.on('close', () => {
                        //console.log(logs);
                        client.emit('logs', { data: logs, error: false });
                    })

                } else {
                    console.log('no files found')
                    client.emit('logs', { data: {}, error: 'no files found' });
                }
            } catch (err) {
                console.error(err)
                client.emit('logs', { data: {}, error: err });
            }
        });

        client.on('requestStreamData', (interval) => {
            console.log('client is subscribing to data stream with interval ', interval);
            streamTimer = setInterval(() => {
                client.emit('streamData', streamData);
            }, interval);
        })

        client.on('cancelStreamData', () => {
            console.log('client has unsubscribed to data stream');
            clearInterval(timer);
        })

        client.on('requestBalanceData', (key) => {
            console.log('client requested balance');
            balanceRequest.request(key, (balance) => {
                client.emit('balanceData', balance);
            });
        })

        client.on('requestSnapshotData', (data) => {
            console.log('client requested snapshot data');
            const size = Math.min(data.size, 30);
            snapshotTimer = setInterval(() => {
                client.emit('snapshotData', sortedArbitrageObjs.slice(0, size));
            }, data.interval);
        })

        client.on('cancelSnapshotData', () => {
            console.log('client has unsubscribed to snapshot data');
            clearInterval(snapshotTimer);
        })

        client.on('sendLimitOrders', (requestObj) => {
            console.log('client submitted limit orders');
            tradeExecutor.placeLimitOrders(requestObj, (res) => {
                client.emit('placedLimitOrdersRes', res);
            });
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

    // scheduled responsibility with master node
    // mailer
    // AoC update
} else {
    console.log('Worker started with pid:', process.pid, 'and id:', process.env.workerId);
    let id = process.env.workerId;

    const interval = 500;
    const cdThreshold = 60; // ticks initial and post-trade cool down
    const minFilterLevel = 1.001 // filter on sorted arbObjs for oppsProcessor
    let cooldown = cdThreshold;
    let toRunOp = true;

    process.on('message', msg => {
        // console.log('Message from master:', msg,id);
        // respond to master
        if (msg.body == 'initiate') {
            //console.log('Message from master:', msg);
            process.send({
                type: 'initiate',
                res: jobMap[process.env.workerId],
            })
        }

        if (msg.task == 'priceDataStream' && jobMap[id] == msg.task) {
            //console.log('Message from master:', msg.task);
            priceStream.updateProductProps(msg.body.balanceData, msg.body.exchangeData);
            priceStream.masterStream();
            setInterval(() => {
                process.send({
                    type: 'priceDataStream',
                    res: { priceData: priceStream.priceData, streamData: priceStream.streamData },
                })
            }, interval)
        }

        if (msg.task == 'priceDataStreamUpdateProps' && jobMap[id] == 'priceDataStream') {
            priceStream.updateProductProps(msg.body.balanceData, msg.body.exchangeData);
        }

        if (msg.task == 'routeCalculate' && jobMap[id] == msg.task) {
            //console.log('Message from master:', msg.task);
            // console.time('routecalc');
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

            let tmstmp_currentSys = new Date();
            let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);
            let filteredArbitrageObjs = [];

            let arbitrageObjs = routeCalculator.calculateNetValue(msg.body.priceData);
            let sortedArbitrageObjs = sortArbitrageObjs(arbitrageObjs);

            for (const arbObj of sortedArbitrageObjs) {
                if (arbObj.price.slice(-1)[0] > minFilterLevel) {
                    filteredArbitrageObjs.push(arbObj);
                }
            }

            process.send({
                type: 'routeCalculate',
                res: { sortedArbitrageObjs, filteredArbitrageObjs },
            }) // respond to master

            for (const arbObj of filteredArbitrageObjs) {
                fs.appendFile('./log/opportunity-' + tmstmp_currentSysDate + '.json', JSON.stringify(arbObj) + '\n', (err) => {
                    if (err) {
                        console.log('Error occured when writing to opportunity log', { tmstmp_currentSys, err });
                    }
                });
            } // process logging
            // console.timeEnd('routecalc');
        }

        if (msg.task == 'oppsProcessor' && jobMap[id] == msg.task) {
            //console.log('Message from master:', msg.task);
            const { filteredArbitrageObjs, balanceData, exchangeData, testMode } = msg.body;
            let tmstmp_currentSys = new Date();
            let tmstmp_currentSysDate = tmstmp_currentSys.toJSON().slice(0, 10);

            if (filteredArbitrageObjs.length > 0) {
                // execute process via callback to avoid clogging up controller
                if (toRunOp && (cooldown <= 0)) {
                    toRunOp = false;
                    console.log('processing sorted and filtered opportunities')
                    oppsProcessor.digest(filteredArbitrageObjs, balanceData, exchangeData, testMode, async (verifyOutput, tradeRes, id) => {
                        //eachOp
                        cooldown = cdThreshold;
                        if (verifyOutput)
                            fs.appendFile('./log/validation-' + tmstmp_currentSysDate + '.json', JSON.stringify(verifyOutput) + '\n', (err) => {
                                if (err) { console.log('Error occured when writing to validation log', { tmstmp_currentSys, err }); }
                            });
                        console.log(`processed opportunity id ${id}`);
                        if (tradeRes) {
                            let balanceData = await balanceRequest.batchApiBalanceRequest(config.thisCredSet);
                            tradeRes.balancePost = tradeExecutor.balanceObjFilter(balanceData, tradeRes.verificationLog.route);
                            fs.appendFile('./log/execution-' + tmstmp_currentSysDate + '.json', JSON.stringify(tradeRes) + '\n', (err) => {
                                if (err) { console.log('Error occured when writing to execution log', { tmstmp_currentSys, err }); }
                            });
                            process.send({
                                type: 'oppsProcessor',
                                res: { balanceData },
                            })
                        };
                    }, () => { toRunOp = true; }) //endOp
                }
                // if (cooldown > 0) { console.log(`sorted arb objects ready but opps processor in ${cooldown}s cooldown`) }
                // if (!toRunOp) { console.log('sorted arb objects ready but opps processor still busy...') }
            }
            cooldown--;
        }

    });

}