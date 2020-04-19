import React from 'react';
import 'date-fns';
// import { makeStyles } from '@material-ui/core/styles';
import Title from './Title';
import { requestTradeLogs, cancelTradeLogsListener } from '../api';
import Grid from '@material-ui/core/Grid';
import Log from './Log';
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider, DatePicker} from '@material-ui/pickers';
import MaterialTable from 'material-table';
import { forwardRef } from 'react';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Paper } from '@material-ui/core';

const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
  };

// const tradeLog_dummy = [
//   {"type":"verification","timestamp":"2020-01-06T21:58:37.475Z","tradeObj":{"route":["BTCGBP-kraken","GBPBTC-coinbase"],"price":[5839,0.00017351140230180225,1.0050432104120723],"mktSize":[0.106,34574.09669,0.106],"timestamp":[1578347916764,1578347917178],"tradeFee":[0.003,0.005],"depositFee":[0,0],"withdrawalFee":[0,0],"tradeSide":["sell","buy"],"tradeKey":["BTCGBP-kraken","BTCGBP-coinbase"],"refMult":1,"accSize":[0.009056,145.2209276174975],"balanceFilteredValue":0.0000456713134917245,"tradeSizeMax":[0.009056,0.00910167]},"orderbookData":{"BTCGBP-kraken":{"bid":["5839.00000","0.106"],"ask":["5839.10000","0.030"]},"BTCGBP-coinbase":{"bid":["5751.56","1.25707632",2],"ask":["5763.31","5.999",1]}},"balanceData":{"coinfloor":{"BTC":"0.0000","GBP":"15.38","ETH":"0.0000"},"binance":{"BTC":"0.00121709","LTC":"0.00000000","ETH":"0.00000000","NEO":"0.00000000","BNB":"4.82366662","QTUM":"0.00000000","EOS":"0.00000000","SNT":"0.00000000","BNT":"0.00000000","GAS":"0.00000000","BCC":"0.00000000","USDT":"0.00000000","HSR":"0.00000000","OAX":"0.00000000","DNT":"0.00000000","MCO":"0.00000000","ICN":"0.00000000","ZRX":"0.00000000","OMG":"0.00000000","WTC":"0.00000000","YOYO":"0.00000000","LRC":"0.00000000","TRX":"0.00000000","SNGLS":"0.00000000","STRAT":"0.00000000","BQX":"0.00000000","FUN":"0.00000000","KNC":"0.00000000","CDT":"0.00000000","XVG":"0.00000000","IOTA":"25.00000000","SNM":"0.00000000","LINK":"0.00000000","CVC":"0.00000000","TNT":"0.00000000","REP":"0.00000000","MDA":"0.00000000","MTL":"0.00000000","SALT":"0.00000000","NULS":"0.00000000","SUB":"0.00000000","STX":"0.00000000","MTH":"0.00000000","ADX":"0.00000000","ETC":"0.00000000","ENG":"0.00000000","ZEC":"0.00000000","AST":"0.00000000","GNT":"0.00000000","DGD":"0.00000000","BAT":"0.00000000","DASH":"0.00000000","POWR":"0.00000000","BTG":"0.00000000","REQ":"0.00000000","XMR":"0.10037474","EVX":"0.00000000","VIB":"0.00000000","ENJ":"0.00000000","VEN":"0.00000000","ARK":"0.00000000","XRP":"350.00000000","MOD":"0.00000000","STORJ":"0.00000000","KMD":"0.00000000","RCN":"0.00000000","EDO":"0.00000000","DATA":"0.00000000","DLT":"0.00000000","MANA":"0.00000000","PPT":"0.00000000","RDN":"0.00000000","GXS":"0.00000000","AMB":"0.00000000","ARN":"0.00000000","BCPT":"0.00000000","CND":"0.00000000","GVT":"0.00000000","POE":"0.00000000","BTS":"0.00000000","FUEL":"0.00000000","XZC":"0.00000000","QSP":"0.00000000","LSK":"0.00000000","BCD":"0.00000000","TNB":"0.00000000","ADA":"0.00000000","LEND":"0.00000000","XLM":"104.93920222","CMT":"0.00000000","WAVES":"24.69000000","WABI":"0.00000000","GTO":"0.00000000","ICX":"0.00000000","OST":"0.00000000","ELF":"0.00000000","AION":"0.00000000","WINGS":"0.00000000","BRD":"0.00000000","NEBL":"0.00000000","NAV":"0.00000000","VIBE":"0.00000000","LUN":"0.00000000","TRIG":"0.00000000","APPC":"0.00000000","CHAT":"0.00000000","RLC":"0.00000000","INS":"0.00000000","PIVX":"0.00000000","IOST":"0.00000000","STEEM":"0.00000000","NANO":"8.67000000","AE":"0.00000000","VIA":"0.00000000","BLZ":"0.00000000","SYS":"0.00000000","RPX":"0.00000000","NCASH":"0.00000000","POA":"0.00000000","ONT":"0.00000000","ZIL":"0.00000000","STORM":"0.00000000","XEM":"0.00000000","WAN":"0.00000000","WPR":"0.00000000","QLC":"0.00000000","GRS":"0.00000000","CLOAK":"0.00000000","LOOM":"0.00000000","BCN":"0.00000000","TUSD":"0.00000000","ZEN":"0.00000000","SKY":"0.00000000","THETA":"0.00000000","IOTX":"0.00000000","QKC":"0.00000000","AGI":"0.00000000","NXS":"0.00000000","SC":"0.00000000","NPXS":"0.00000000","KEY":"0.00000000","NAS":"0.00000000","MFT":"0.00000000","DENT":"0.00000000","ARDR":"0.00000000","HOT":"0.00000000","VET":"0.00000000","DOCK":"0.00000000","POLY":"0.00000000","ONG":"0.00000000","PHX":"0.00000000","HC":"0.00000000","GO":"0.00000000","PAX":"0.00000000","RVN":"0.00000000","DCR":"0.00000000","USDC":"0.00000000","MITH":"0.00000000","BCHABC":"0.00000000","BCHSV":"0.00000000","REN":"0.00000000","BTT":"0.00000000","USDS":"0.00000000","FET":"0.00000000","TFUEL":"0.00000000","CELR":"0.00000000","MATIC":"0.00000000","ATOM":"0.00000000","PHB":"0.00000000","ONE":"0.00000000","FTM":"0.00000000","BTCB":"0.00000000","USDSB":"0.00000000","CHZ":"0.00000000","COS":"0.00000000","ALGO":"0.00000000","ERD":"0.00000000","DOGE":"0.00000000","BGBP":"0.00000000","DUSK":"0.00000000","ANKR":"0.00000000","WIN":"0.00000000","TUSDB":"0.00000000","COCOS":"0.00000000","PERL":"0.00000000","TOMO":"0.00000000","BUSD":"0.00000000","BAND":"0.00000000","BEAM":"0.00000000","HBAR":"0.00000000","XTZ":"0.00000000","NGN":"0.00000000","NKN":"0.00000000","EUR":"0.00000000","KAVA":"0.00000000","RUB":"0.00000000","ARPA":"0.00000000","TRY":"0.00000000","CTXC":"0.00000000","BCH":"0.00000000","TROY":"0.00000000","VITE":"0.00000000","FTT":"0.00000000"},"kraken":{"GBP":"44.5102","BTC":"0.0090560000","ETH":"0.6489251800"},"coinbase":{"ZRX":"0","BTC":"0.31849197","ZIL":"0","XTZ":"0","XRP":"0","XLM":"0","USDC":"0","REP":"0","OXT":"0","MKR":"0","MANA":"0","LTC":"2","LOOM":"0","LINK":"0","GNT":"0","GBP":"145.2209276174975","EUR":"0.000000874626","ETH":"7.62337986","ETC":"0","EOS":"0","DNT":"0","DAI":"0","CVC":"0","BCH":"1.3756","BAT":"0","ALGO":"0"}},"verification1":[{"sv":0.009056,"ev":52.719350047999995,"tradeQty":0.009056},{"sv":52.719350047999995,"ev":0.00910167,"tradeQty":0.00910167}],"verification2":[{"sv":0.009056,"ev":52.719350047999995,"tradeQty":0.009056},{"sv":52.719350047999995,"ev":0.00910167,"tradeQty":0.00910167}],"status":true},
//   {"type":"execution","id":"BTCGBP-kraken:GBPBTC-coinbase2020-01-06T21:58:37.475Z","timestamp":"2020-01-06T21:58:37.475","orderParams":[{"exchange":"kraken","pair":"BTCGBP","quantity_base":0.009056,"buysell":"sell"},{"exchange":"coinbase","pair":"BTCGBP","quantity_base":0.00910167,"buysell":"buy"}],"balancePrior":{"kraken":{"BTC":"0.0090560000","GBP":"44.5102"},"coinbase":{"GBP":"145.2209276174975","BTC":"0.31849197"}},"tradeRes":[{"kraken":{"error":[],"result":{"descr":{"order":"sell 0.00905600 XBTGBP @ market"}}}},{"coinbase":{"message":"Insufficient funds"}}],"balancePost":{"kraken":{"BTC":"0.0090560000","GBP":"44.5102"},"coinbase":{"GBP":"145.2209276174975","BTC":"0.31849197"}}},
//   {"type":"verification","timestamp":"2020-01-06T21:59:08.609Z","tradeObj":{"route":["BTCGBP-kraken","GBPBTC-coinbase"],"price":[5839,0.00017351140230180225,1.0050432104120723],"mktSize":[0.266,34287.2067257692,0.266],"timestamp":[1578347947834,1578347948265],"tradeFee":[0.003,0.005],"depositFee":[0,0],"withdrawalFee":[0,0],"tradeSide":["sell","buy"],"tradeKey":["BTCGBP-kraken","BTCGBP-coinbase"],"refMult":1,"accSize":[0.009056,145.2209276174975],"balanceFilteredValue":0.0000456713134917245,"tradeSizeMax":[0.009056,0.00910167]},"orderbookData":{"BTCGBP-kraken":{"bid":["5839.00000","0.266"],"ask":["5840.60000","0.012"]},"BTCGBP-coinbase":{"bid":["5754.93","0.499",1],"ask":["5763.31","5.94922132",1]}},"balanceData":{"coinfloor":{"ETH":"0.0000","GBP":"15.38","BTC":"0.0000"},"coinbase":{"ZRX":"0","BTC":"0.31849197","ZIL":"0","XTZ":"0","XRP":"0","XLM":"0","USDC":"0","REP":"0","OXT":"0","MKR":"0","MANA":"0","LTC":"2","LOOM":"0","LINK":"0","GNT":"0","GBP":"145.2209276174975","EUR":"0.000000874626","ETH":"7.62337986","ETC":"0","EOS":"0","DNT":"0","DAI":"0","CVC":"0","BCH":"1.3756","BAT":"0","ALGO":"0"},"binance":{"BTC":"0.00121709","LTC":"0.00000000","ETH":"0.00000000","NEO":"0.00000000","BNB":"4.82366662","QTUM":"0.00000000","EOS":"0.00000000","SNT":"0.00000000","BNT":"0.00000000","GAS":"0.00000000","BCC":"0.00000000","USDT":"0.00000000","HSR":"0.00000000","OAX":"0.00000000","DNT":"0.00000000","MCO":"0.00000000","ICN":"0.00000000","ZRX":"0.00000000","OMG":"0.00000000","WTC":"0.00000000","YOYO":"0.00000000","LRC":"0.00000000","TRX":"0.00000000","SNGLS":"0.00000000","STRAT":"0.00000000","BQX":"0.00000000","FUN":"0.00000000","KNC":"0.00000000","CDT":"0.00000000","XVG":"0.00000000","IOTA":"25.00000000","SNM":"0.00000000","LINK":"0.00000000","CVC":"0.00000000","TNT":"0.00000000","REP":"0.00000000","MDA":"0.00000000","MTL":"0.00000000","SALT":"0.00000000","NULS":"0.00000000","SUB":"0.00000000","STX":"0.00000000","MTH":"0.00000000","ADX":"0.00000000","ETC":"0.00000000","ENG":"0.00000000","ZEC":"0.00000000","AST":"0.00000000","GNT":"0.00000000","DGD":"0.00000000","BAT":"0.00000000","DASH":"0.00000000","POWR":"0.00000000","BTG":"0.00000000","REQ":"0.00000000","XMR":"0.10037474","EVX":"0.00000000","VIB":"0.00000000","ENJ":"0.00000000","VEN":"0.00000000","ARK":"0.00000000","XRP":"350.00000000","MOD":"0.00000000","STORJ":"0.00000000","KMD":"0.00000000","RCN":"0.00000000","EDO":"0.00000000","DATA":"0.00000000","DLT":"0.00000000","MANA":"0.00000000","PPT":"0.00000000","RDN":"0.00000000","GXS":"0.00000000","AMB":"0.00000000","ARN":"0.00000000","BCPT":"0.00000000","CND":"0.00000000","GVT":"0.00000000","POE":"0.00000000","BTS":"0.00000000","FUEL":"0.00000000","XZC":"0.00000000","QSP":"0.00000000","LSK":"0.00000000","BCD":"0.00000000","TNB":"0.00000000","ADA":"0.00000000","LEND":"0.00000000","XLM":"104.93920222","CMT":"0.00000000","WAVES":"24.69000000","WABI":"0.00000000","GTO":"0.00000000","ICX":"0.00000000","OST":"0.00000000","ELF":"0.00000000","AION":"0.00000000","WINGS":"0.00000000","BRD":"0.00000000","NEBL":"0.00000000","NAV":"0.00000000","VIBE":"0.00000000","LUN":"0.00000000","TRIG":"0.00000000","APPC":"0.00000000","CHAT":"0.00000000","RLC":"0.00000000","INS":"0.00000000","PIVX":"0.00000000","IOST":"0.00000000","STEEM":"0.00000000","NANO":"8.67000000","AE":"0.00000000","VIA":"0.00000000","BLZ":"0.00000000","SYS":"0.00000000","RPX":"0.00000000","NCASH":"0.00000000","POA":"0.00000000","ONT":"0.00000000","ZIL":"0.00000000","STORM":"0.00000000","XEM":"0.00000000","WAN":"0.00000000","WPR":"0.00000000","QLC":"0.00000000","GRS":"0.00000000","CLOAK":"0.00000000","LOOM":"0.00000000","BCN":"0.00000000","TUSD":"0.00000000","ZEN":"0.00000000","SKY":"0.00000000","THETA":"0.00000000","IOTX":"0.00000000","QKC":"0.00000000","AGI":"0.00000000","NXS":"0.00000000","SC":"0.00000000","NPXS":"0.00000000","KEY":"0.00000000","NAS":"0.00000000","MFT":"0.00000000","DENT":"0.00000000","ARDR":"0.00000000","HOT":"0.00000000","VET":"0.00000000","DOCK":"0.00000000","POLY":"0.00000000","ONG":"0.00000000","PHX":"0.00000000","HC":"0.00000000","GO":"0.00000000","PAX":"0.00000000","RVN":"0.00000000","DCR":"0.00000000","USDC":"0.00000000","MITH":"0.00000000","BCHABC":"0.00000000","BCHSV":"0.00000000","REN":"0.00000000","BTT":"0.00000000","USDS":"0.00000000","FET":"0.00000000","TFUEL":"0.00000000","CELR":"0.00000000","MATIC":"0.00000000","ATOM":"0.00000000","PHB":"0.00000000","ONE":"0.00000000","FTM":"0.00000000","BTCB":"0.00000000","USDSB":"0.00000000","CHZ":"0.00000000","COS":"0.00000000","ALGO":"0.00000000","ERD":"0.00000000","DOGE":"0.00000000","BGBP":"0.00000000","DUSK":"0.00000000","ANKR":"0.00000000","WIN":"0.00000000","TUSDB":"0.00000000","COCOS":"0.00000000","PERL":"0.00000000","TOMO":"0.00000000","BUSD":"0.00000000","BAND":"0.00000000","BEAM":"0.00000000","HBAR":"0.00000000","XTZ":"0.00000000","NGN":"0.00000000","NKN":"0.00000000","EUR":"0.00000000","KAVA":"0.00000000","RUB":"0.00000000","ARPA":"0.00000000","TRY":"0.00000000","CTXC":"0.00000000","BCH":"0.00000000","TROY":"0.00000000","VITE":"0.00000000","FTT":"0.00000000"},"kraken":{"GBP":"44.5102","BTC":"0.0090560000","ETH":"0.6489251800"}},"verification1":[{"sv":0.009056,"ev":52.719350047999995,"tradeQty":0.009056},{"sv":52.719350047999995,"ev":0.00910167,"tradeQty":0.00910167}],"verification2":[{"sv":0.009056,"ev":52.719350047999995,"tradeQty":0.009056},{"sv":52.719350047999995,"ev":0.00910167,"tradeQty":0.00910167}],"status":true},
//   {"type":"execution","id":"BTCGBP-kraken:GBPBTC-coinbase2020-01-06T21:59:08.609Z","timestamp":"2020-01-06T21:58:37.475","orderParams":[{"exchange":"kraken","pair":"BTCGBP","quantity_base":0.009056,"buysell":"sell"},{"exchange":"coinbase","pair":"BTCGBP","quantity_base":0.00910167,"buysell":"buy"}],"balancePrior":{"kraken":{"BTC":"0.0090560000","GBP":"44.5102"},"coinbase":{"GBP":"145.2209276174975","BTC":"0.31849197"}},"tradeRes":[{"kraken":{"error":[],"result":{"descr":{"order":"sell 0.00905600 XBTGBP @ market"}}}},{"coinbase":{"message":"Insufficient funds"}}],"balancePost":{"kraken":{"BTC":"0.0090560000","GBP":"44.5102"},"coinbase":{"GBP":"145.2209276174975","BTC":"0.31849197"}}},
//   {"type":"verification","timestamp":"2020-01-06T22:59:08.609Z","tradeObj":{"route":["BTCGBP-kraken","GBPBTC-coinbase"],"price":[5839,0.00017351140230180225,1.0050432104120723],"mktSize":[0.266,34287.2067257692,0.266],"timestamp":[1578347947834,1578347948265],"tradeFee":[0.003,0.005],"depositFee":[0,0],"withdrawalFee":[0,0],"tradeSide":["sell","buy"],"tradeKey":["BTCGBP-kraken","BTCGBP-coinbase"],"refMult":1,"accSize":[0.009056,145.2209276174975],"balanceFilteredValue":0.0000456713134917245,"tradeSizeMax":[0.009056,0.00910167]},"orderbookData":{"BTCGBP-kraken":{"bid":["5839.00000","0.266"],"ask":["5840.60000","0.012"]},"BTCGBP-coinbase":{"bid":["5754.93","0.499",1],"ask":["5763.31","5.94922132",1]}},"balanceData":{"coinfloor":{"ETH":"0.0000","GBP":"15.38","BTC":"0.0000"},"coinbase":{"ZRX":"0","BTC":"0.31849197","ZIL":"0","XTZ":"0","XRP":"0","XLM":"0","USDC":"0","REP":"0","OXT":"0","MKR":"0","MANA":"0","LTC":"2","LOOM":"0","LINK":"0","GNT":"0","GBP":"145.2209276174975","EUR":"0.000000874626","ETH":"7.62337986","ETC":"0","EOS":"0","DNT":"0","DAI":"0","CVC":"0","BCH":"1.3756","BAT":"0","ALGO":"0"},"binance":{"BTC":"0.00121709","LTC":"0.00000000","ETH":"0.00000000","NEO":"0.00000000","BNB":"4.82366662","QTUM":"0.00000000","EOS":"0.00000000","SNT":"0.00000000","BNT":"0.00000000","GAS":"0.00000000","BCC":"0.00000000","USDT":"0.00000000","HSR":"0.00000000","OAX":"0.00000000","DNT":"0.00000000","MCO":"0.00000000","ICN":"0.00000000","ZRX":"0.00000000","OMG":"0.00000000","WTC":"0.00000000","YOYO":"0.00000000","LRC":"0.00000000","TRX":"0.00000000","SNGLS":"0.00000000","STRAT":"0.00000000","BQX":"0.00000000","FUN":"0.00000000","KNC":"0.00000000","CDT":"0.00000000","XVG":"0.00000000","IOTA":"25.00000000","SNM":"0.00000000","LINK":"0.00000000","CVC":"0.00000000","TNT":"0.00000000","REP":"0.00000000","MDA":"0.00000000","MTL":"0.00000000","SALT":"0.00000000","NULS":"0.00000000","SUB":"0.00000000","STX":"0.00000000","MTH":"0.00000000","ADX":"0.00000000","ETC":"0.00000000","ENG":"0.00000000","ZEC":"0.00000000","AST":"0.00000000","GNT":"0.00000000","DGD":"0.00000000","BAT":"0.00000000","DASH":"0.00000000","POWR":"0.00000000","BTG":"0.00000000","REQ":"0.00000000","XMR":"0.10037474","EVX":"0.00000000","VIB":"0.00000000","ENJ":"0.00000000","VEN":"0.00000000","ARK":"0.00000000","XRP":"350.00000000","MOD":"0.00000000","STORJ":"0.00000000","KMD":"0.00000000","RCN":"0.00000000","EDO":"0.00000000","DATA":"0.00000000","DLT":"0.00000000","MANA":"0.00000000","PPT":"0.00000000","RDN":"0.00000000","GXS":"0.00000000","AMB":"0.00000000","ARN":"0.00000000","BCPT":"0.00000000","CND":"0.00000000","GVT":"0.00000000","POE":"0.00000000","BTS":"0.00000000","FUEL":"0.00000000","XZC":"0.00000000","QSP":"0.00000000","LSK":"0.00000000","BCD":"0.00000000","TNB":"0.00000000","ADA":"0.00000000","LEND":"0.00000000","XLM":"104.93920222","CMT":"0.00000000","WAVES":"24.69000000","WABI":"0.00000000","GTO":"0.00000000","ICX":"0.00000000","OST":"0.00000000","ELF":"0.00000000","AION":"0.00000000","WINGS":"0.00000000","BRD":"0.00000000","NEBL":"0.00000000","NAV":"0.00000000","VIBE":"0.00000000","LUN":"0.00000000","TRIG":"0.00000000","APPC":"0.00000000","CHAT":"0.00000000","RLC":"0.00000000","INS":"0.00000000","PIVX":"0.00000000","IOST":"0.00000000","STEEM":"0.00000000","NANO":"8.67000000","AE":"0.00000000","VIA":"0.00000000","BLZ":"0.00000000","SYS":"0.00000000","RPX":"0.00000000","NCASH":"0.00000000","POA":"0.00000000","ONT":"0.00000000","ZIL":"0.00000000","STORM":"0.00000000","XEM":"0.00000000","WAN":"0.00000000","WPR":"0.00000000","QLC":"0.00000000","GRS":"0.00000000","CLOAK":"0.00000000","LOOM":"0.00000000","BCN":"0.00000000","TUSD":"0.00000000","ZEN":"0.00000000","SKY":"0.00000000","THETA":"0.00000000","IOTX":"0.00000000","QKC":"0.00000000","AGI":"0.00000000","NXS":"0.00000000","SC":"0.00000000","NPXS":"0.00000000","KEY":"0.00000000","NAS":"0.00000000","MFT":"0.00000000","DENT":"0.00000000","ARDR":"0.00000000","HOT":"0.00000000","VET":"0.00000000","DOCK":"0.00000000","POLY":"0.00000000","ONG":"0.00000000","PHX":"0.00000000","HC":"0.00000000","GO":"0.00000000","PAX":"0.00000000","RVN":"0.00000000","DCR":"0.00000000","USDC":"0.00000000","MITH":"0.00000000","BCHABC":"0.00000000","BCHSV":"0.00000000","REN":"0.00000000","BTT":"0.00000000","USDS":"0.00000000","FET":"0.00000000","TFUEL":"0.00000000","CELR":"0.00000000","MATIC":"0.00000000","ATOM":"0.00000000","PHB":"0.00000000","ONE":"0.00000000","FTM":"0.00000000","BTCB":"0.00000000","USDSB":"0.00000000","CHZ":"0.00000000","COS":"0.00000000","ALGO":"0.00000000","ERD":"0.00000000","DOGE":"0.00000000","BGBP":"0.00000000","DUSK":"0.00000000","ANKR":"0.00000000","WIN":"0.00000000","TUSDB":"0.00000000","COCOS":"0.00000000","PERL":"0.00000000","TOMO":"0.00000000","BUSD":"0.00000000","BAND":"0.00000000","BEAM":"0.00000000","HBAR":"0.00000000","XTZ":"0.00000000","NGN":"0.00000000","NKN":"0.00000000","EUR":"0.00000000","KAVA":"0.00000000","RUB":"0.00000000","ARPA":"0.00000000","TRY":"0.00000000","CTXC":"0.00000000","BCH":"0.00000000","TROY":"0.00000000","VITE":"0.00000000","FTT":"0.00000000"},"kraken":{"GBP":"44.5102","BTC":"0.0090560000","ETH":"0.6489251800"}},"verification1":[{"sv":0.009056,"ev":52.719350047999995,"tradeQty":0.009056},{"sv":52.719350047999995,"ev":0.00910167,"tradeQty":0.00910167}],"verification2":[{"sv":0.009056,"ev":52.719350047999995,"tradeQty":0.009056},{"sv":52.719350047999995,"ev":0.00910167,"tradeQty":0.00910167}],"status":true},
// ]

// const useStyles = makeStyles(theme => ({
//   seeMore: {
//     marginTop: theme.spacing(3),
//   },
// }));

export default function Opports() {
  const [verificationLogs, setVerificationLogs] = React.useState([]);
  const [executionLogs, setExecutionLogs] = React.useState({})
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [loading, setLoading] = React.useState(false);
  const formatCell = (arr) => {
    let formattedArr = []
    arr.forEach( (value) => {
      formattedArr.push(Number.parseFloat(value).toFixed(6));
    })
    return formattedArr;
  }

  const handleDateChange = date => {
    setSelectedDate(date);
    setLoading(true);
    let requestDate = date.toJSON().slice(0,10);
    processTradeLogs(requestDate);
  };

  const processTradeLogs = date => {
      // request data according to date
      // process the tradeLogs using callback
      cancelTradeLogsListener();
      requestTradeLogs(date, (err, tradeLogs) => {
        //tradeLogs = tradeLog_dummy; // to remove post testing
        if (err) {
          console.log(err);
          setLoading(false);
          setVerificationLogs([]);
        return;
        }
        
        // console.log(tradeLogs);
        let tradeLogs_verification = [];
        let tradeLogs_execution = {};
        tradeLogs.forEach( (log) => {
          if (log.type === 'verification'){
            tradeLogs_verification.push(log);
            let id = log.tradeObj.route.join(':') + log.timestamp;
            tradeLogs_execution[id] = {};
          }
          
          if (log.type === 'execution'){
            let id = log.id;
            tradeLogs_execution[id] = log;
          }
        })
        setLoading(false);
        setVerificationLogs([...tradeLogs_verification]);
        setExecutionLogs({...tradeLogs_execution});
      });
  
  }

  React.useEffect(() => {
    let today = new Date();
    let requestDate = today.toJSON().slice(0,10);
    setLoading(true);
    processTradeLogs(requestDate);
    return () => {
      cancelTradeLogsListener();
    }
  }, []);

  if (!verificationLogs) {
    return <div />
  }

  return (
    <React.Fragment>
      {/* {console.log(executionLogs)} */}
      <Title>Trade Logs</Title>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DatePicker
                margin="normal"
                id="date-picker-dialog"
                label="Select dates"
                format="dd MMMM yyyy"
                value={selectedDate}
                onChange={handleDateChange}
            />
          </MuiPickersUtilsProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
        </Grid>
      </Grid>
      <br />
      {loading && <CircularProgress size={34} />}
      {!loading &&
      <MaterialTable 
        title='Trade opportunities'
        columns={[
          {title:'Time', field:'timestamp', render: rowData => rowData.timestamp.slice(11,19)},
          {title:'Pairs', field:'tradeObj.route', render: rowData => {return (
            rowData.tradeObj.route.map((v,i) => {return(<div key={i}>{v.split('-')[0]}</div>)})
          )}, cellStyle: {verticalAlign: "top"}, sorting: false},
          {title:'Exchanges', field:'tradeObj.route', render: rowData => {return (
            rowData.tradeObj.route.map((v,i) => {return(<div key={i}>{v.split('-')[1]}</div>)})
          )}, cellStyle: {verticalAlign: "top"}, sorting: false},
          {title:'Market', field:'tradeObj.route', render: rowData => {return (
            formatCell(rowData.tradeObj.mktSize).map((v,i) => {return(<div key={i}>{v}</div>)})
          )}, sorting: false},
          {title:'Account', field:'tradeObj.route', render: rowData => {return (
            formatCell(rowData.tradeObj.accSize).map((v,i) => {return(<div key={i}>{v}</div>)})
          )}, cellStyle: {verticalAlign: "top"}, sorting: false},
          {title:'Price', field:'tradeObj.route', render: rowData => {return (
            formatCell(rowData.tradeObj.price).map((v,i) => {return(<div key={i}>{v}</div>)})
          )}, sorting: false},
          {title:'Profit', field:'tradeObj.balanceFilteredValue', render: rowData => {return (
            Number.parseFloat(rowData.tradeObj.balanceFilteredValue).toFixed(6)
          )}, defaultSort: 'desc'},
          {title:'Details', field:'tradeObj', render: rowData => {return (
            <Log verificationLog={rowData} executionLog={executionLogs[rowData.tradeObj.route.join(':')+rowData.timestamp]}></Log>
          )}, sorting: false},
        ]}
        data={
          verificationLogs
        }       
        options={{
          search: true,
          sorting: true,
          headerStyle:{fontWeight:"700", fontSize:"0.9rem"},
        }}
        icons={tableIcons}
        components={{
          Container: props => <Paper {...props} elevation={0}/>
        }}
      />}

    </React.Fragment>
  );
}
