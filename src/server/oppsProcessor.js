// price data restful (adhoc)
const priceDataApi = require('./priceDataApi');
// trade validator and eExecutor (adhoc)
const tradeValidator = require('./tradeValidate');
const tradeExecutor = require('./tradeExecute');
const config = require('./config/config');

const { tradeTrigger_pc, tradeTrigger_val, batch_limit } = config
// pc 1.005 = 0.5% and above, up to 0.3% to 0.8% trade fee (2 legs) and rebalancing cost
// val ref 0.000067 ~ £0.5 @ £7500/btc
// batchlimit max number of validations per cycle/batch

const digest = async (sortedArbitrageObjs, balanceData, exchangeData, testMode, eachOp, endOp) => {
    let index = 0;
    console.time('cycle');
    for (opportunity of sortedArbitrageObjs) {
        //console.log(opportunity);
        if (index >= batch_limit) break;

        let return_pc = opportunity.price.slice(-1)[0];
        let opportunity_id = opportunity.route.join('-') + '-' + opportunity.timestamp.slice(-1)[0];
        console.log(`Validating item ${index + 1}...${opportunity_id}`);

        // check refValue (abs nominal) or relative? above threshold
        if (opportunity.refValue >= tradeTrigger_val && return_pc >= tradeTrigger_pc) {
            console.log(`Item ${index + 1}...${opportunity_id} passed minimum filter`);
            console.time(opportunity_id);
            let priceApi = await priceDataApi.batchPriceDataApiRequest(opportunity.tradeKey);
            if (!priceApi) {
                console.log('Opportunity skipped due to priceApi error');
                continue;
            }
            let verifyOutput = tradeValidator.validate(opportunity, priceApi, balanceData, exchangeData)
            console.timeEnd(opportunity_id);
            let tradeRes;
            if (verifyOutput.status) {
                console.log(`Opportunity validation passed...${opportunity_id}`);
                tradeRes = await tradeExecutor.execute(verifyOutput, balanceData, testMode);
                eachOp(verifyOutput, tradeRes, opportunity_id);
                endOp();
                // console.log('Balance post', balanceData);
                break;
            } else {
                console.log(`Opportunity validation failed...${opportunity_id}`)
                eachOp(verifyOutput, null, opportunity_id);
            }
        } else {
            console.log(`Item ${index + 1} failed minimum filter`);
            eachOp(null, null, opportunity_id);
        }
        index++;
    }
    console.timeEnd('cycle');
    endOp();
}

module.exports = { digest };

const prototype_mode = process.argv[2] || false;

if (prototype_mode == 'true') {
    const fs = require('fs');
    const readline = require('readline');
    const balanceData = require('./log/balanceData2020-04-26.json');
    const exchangeData = require('./log/exchangeData2020-04-26.json');
    let tradeLogs = [];
    // let path = '../../../arbitorLog/tradeOpportunity2020-04-23.json';
    let path = './log/opportunity-2020-04-27.json'

    try {
        if (fs.existsSync(path)) {
            //file exists
            const readInterface = readline.createInterface({
                input: fs.createReadStream(path),
                //output: process.stdout,
                console: false
            });

            readInterface.on('line', (line) => {
                tradeLogs.push(JSON.parse(line))
            });

            readInterface.on('close', () => {
                console.log(tradeLogs.length);
                digest(tradeLogs, balanceData, exchangeData, (verifyOutput, tradeRes, id) => {
                    console.log(`${id} processed...`);
                }, () => { console.log('end of process') });
            })

        } else {
            console.log('no files found')
        }
    } catch (err) {
        console.error(err)
    }
}

