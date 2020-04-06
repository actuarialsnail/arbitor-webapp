const balanceRequest = require('./balanceRequest');
const exchangeInfo = require('./exchangeInfo');

const minOrderSize = {}

const asyncReq = async() => {
    let balanceData = await balanceRequest.batchApiBalanceRequest();
    let exchangeData = await exchangeInfo.batchExchangeInfoRequest();

    console.log(balanceData);
    console.log(exchangeData);


}

asyncReq();