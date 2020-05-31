import React from 'react';
import { requestStreamData, cancelStreamData } from '../api';
import { requestBalanceData, cancelBalanceListener } from '../api';
import { sendOrderParams, cancelOrdersParamsListener } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import TextField from '@material-ui/core/TextField';
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
import Grid from '@material-ui/core/Grid';
import ErrorIcon from '@material-ui/icons/Error';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

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

const useStyles = makeStyles(theme => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
    table: {
        width: '950px',
    }
}));

export default function BalanceView() {
    const classes = useStyles();
    const [balanceData, setBalanceData] = React.useState('no balanceData yet');
    const [streamData, setStreamData] = React.useState('no streamData yet');
    const [text, setText] = React.useState('');
    const [loadedStr, setLoadedStr] = React.useState(false);
    const [loadedBal, setLoadedBal] = React.useState(false);
    const [totCost, setTotCost] = React.useState(0);
    const [tradeKeys, setTradeKeys] = React.useState([]);
    const [balanceTotal, setBalanceTotal] = React.useState({});
    React.useEffect(() => {
        let once = true;
        requestStreamData((data) => {
            // console.log(new Date(), data);
            setStreamData(data);
            if (once) {
                setTradeKeys(Object.keys(data));
                setLoadedStr(true);
                once = false;
            }
        });
        requestBalanceData('', (data) => {
            //console.log(new Date(), data);
            cancelBalanceListener();
            const formattedData = ffBalanceData(data);
            setBalanceData(formattedData);
            calcBalanceTotal(formattedData);
            setLoadedBal(true);
        });
        return () => {
            cancelStreamData();
            cancelBalanceListener();
        }
    }, [])
    const exchangeTradeFee = {
        coinfloor: 0.003,
        coinbase: 0.005,
        kraken: 0.0026,
        binance: 0.001,
        cex: 0.003,
        bisq: 0.01
    }
    const ffBalanceData = (bData) => {
        //console.log(bData)
        let fData = [];
        let currencyList = [];
        Object.keys(bData).forEach(exchange => {
            let rowData = {};
            Object.keys(bData[exchange]).forEach(currency => {
                let balance = Number(bData[exchange][currency]);
                if (balance > 0) {
                    rowData[currency] = balance;
                    rowData[currency + '_post'] = balance;
                    currencyList.push(currency);
                }
            })
            rowData.exchangeName = exchange;
            fData.push(rowData);
        })
        let uniqueCurrencyList = [...new Set(currencyList)];
        let ffData = []
        for (const exchangeData of fData) {
            for (const currency of uniqueCurrencyList) {
                if (!exchangeData.hasOwnProperty(currency)) {
                    exchangeData[currency] = 0;
                }
            }
            ffData.push(exchangeData);
        }
        return { ffData, uniqueCurrencyList, initBal: ffData };
    }

    const handleBalanceRequest = () => {
        setLoadedBal(false);
        setRebalData([]);
        requestBalanceData(text, (data) => {
            //console.log(new Date(), data);
            cancelBalanceListener();
            const formattedData = ffBalanceData(data);
            setBalanceData(formattedData);
            calcBalanceTotal(formattedData);
            setTotCost(0);
            setLoadedBal(true);
        });
    }

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleSubmit = () => {
        sendOrderParams(rebalData, (res) => {
            console.log(res);
            cancelOrdersParamsListener();
        });
    }

    const postRebalanceUpdate = (rebalData) => {
        setLoadedBal(false);
        setTotCost(0);
        let current_balance = balanceData;
        let totCost = {};
        current_balance.ffData = JSON.parse(JSON.stringify(balanceData.initBal));
        let currencyList = current_balance.uniqueCurrencyList;

        for (const rebalOrder of rebalData) {
            const { exchange, pair, side, price, size } = rebalOrder;
            const [p1, p2] = pair.split('-');
            let i = 0;
            for (const row of current_balance.ffData) {
                if (row.exchangeName === exchange) {
                    const p1_prior = row[p1 + '_post'] || 0;
                    const p2_prior = row[p2 + '_post'] || 0;
                    const p1_post = p1_prior + (side === 'buy' ? +1 : -1) * size;
                    const cost = price * size * exchangeTradeFee[exchange];
                    const p2_post = p2_prior + (side === 'buy' ? -1 : +1) * price * size - cost;
                    const accCost = totCost[p2] || 0;
                    totCost[p2] = accCost + cost;
                    current_balance.ffData[i][p1 + '_post'] = p1_post;
                    current_balance.ffData[i][p2 + '_post'] = p2_post;
                    currencyList.push(...[p1, p2]);
                }
                i++;
            }
        }
        current_balance.uniqueCurrencyList = [...new Set(currencyList)];
        setBalanceData(current_balance);
        calcBalanceTotal(current_balance);
        setTotCost(totCost);
        setLoadedBal(true);
    }

    const calcBalanceTotal = (current_balance) => {
        let total_prior = {}; let total_post = {};
        current_balance.uniqueCurrencyList.forEach(currency => {
            total_prior[currency] = 0; total_post[currency] = 0;
            current_balance.ffData.forEach(exchangeData => {
                if (exchangeData[currency]) {
                    total_prior[currency] += exchangeData[currency]
                }
                if (exchangeData[currency + '_post']) {
                    total_post[currency] += exchangeData[currency + '_post'];
                }
            })
        })
        setBalanceTotal({ total_prior, total_post });
    }

    const keysFormat = (keysArr) => {
        let keyObj = {};
        keysArr.forEach(key => {
            keyObj[key] = key
        })
        return keyObj;
    }

    const dt_columns = [
        {
            title: 'Exchange', initialEditValue: 'coinbase',
            field: 'exchange',
            lookup: { coinfloor: 'coinfloor', coinbase: 'coinbase', kraken: 'kraken', binance: 'binance', cex: 'cex' }
        },
        { title: 'Pair', field: 'pair', initialEditValue: 'BTC-EUR', lookup: keysFormat(tradeKeys) },
        { title: 'Side', field: 'side', initialEditValue: 'buy', lookup: { buy: 'buy', sell: 'sell' } },
        { title: 'Type', field: 'type', initialEditValue: 'limit', lookup: { market: 'market', limit: 'limit' } },
        { title: 'Order Price', field: 'price', type: 'numeric' },
        { title: 'Size', field: 'size', type: 'numeric' },
        {
            title: 'Stream Price', field: 'streamprice', initialEditValue: ' ', render: rowData => {
                return (
                    <React.Fragment>
                        <Typography variant="body2" >
                            Bid: {streamData[rowData.pair][rowData.exchange].bids[0].price}
                        </Typography>
                        <Typography variant="body2" >
                            Ask: {streamData[rowData.pair][rowData.exchange].asks[0].price}
                        </Typography>
                    </React.Fragment>
                )
            }
        }
    ]
    const [rebalData, setRebalData] = React.useState([]);

    return (
        <div className={classes.root}>

            <TextField onChange={handleTextChange} />
            <Button variant="outlined" color="primary" onClick={handleBalanceRequest}>
                Request balance
            </Button>
            <Button variant="outlined" color="primary" onClick={handleSubmit}>
                Submit orders
            </Button>
            <Typography>
                Total trade fee: {JSON.stringify(totCost)}
            </Typography>
            <div className={classes.table}>
                <MaterialTable
                    title="Rebalance Orders"
                    icons={tableIcons}
                    columns={dt_columns}
                    data={rebalData}
                    options={{
                        search: false,
                        padding: 'dense',
                        paging: false,
                        minBodyHeight: '300px',
                        tableLayout: 'fixed',
                        draggable: false,
                    }}
                    editable={{
                        onRowAdd: newData =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    newData.text = text;
                                    setRebalData([...rebalData, newData]);
                                    postRebalanceUpdate([...rebalData, newData]);
                                    resolve();
                                }, 100)
                            }),
                        onRowUpdate: (newData, oldData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    const dataUpdate = [...rebalData];
                                    const index = oldData.tableData.id;
                                    newData.text = text;
                                    dataUpdate[index] = newData;
                                    setRebalData([...dataUpdate]);
                                    postRebalanceUpdate([...dataUpdate]);
                                    resolve();
                                }, 100)
                            }),
                        onRowDelete: oldData =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    const dataDelete = [...rebalData];
                                    const index = oldData.tableData.id;
                                    dataDelete.splice(index, 1);
                                    setRebalData([...dataDelete]);
                                    postRebalanceUpdate([...dataDelete]);
                                    resolve()
                                }, 100)
                            }),
                    }}
                />
            </div>
            <Grid container spacing={3}>
                {
                    loadedBal && balanceData.uniqueCurrencyList.map(currency => {
                        const deltaBal = balanceTotal.total_post[currency] - balanceTotal.total_prior[currency];
                        return (
                            <React.Fragment key={currency}>
                                <Grid item xs={12} sm={12} md={6} lg={6} xl={3} >
                                    <Typography variant="h6">{currency} {(deltaBal === 0 ? <CheckCircleIcon color='secondary' /> : <ErrorIcon color='primary' />)} </Typography>
                                    <Typography variant="body2">Prior: {balanceTotal.total_prior[currency]}</Typography>
                                    <Typography variant="body2">Post : {balanceTotal.total_post[currency]}</Typography>
                                    <Typography variant="body2">Delta: {deltaBal}</Typography>
                                    <BarChart width={450} height={200} data={balanceData.ffData} >
                                        <XAxis dataKey="exchangeName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey={currency} fill="#8884d8" />
                                        <Bar dataKey={currency + '_post'} fill="#8bb158" />
                                    </BarChart>
                                </Grid>
                            </React.Fragment>
                        )
                    })
                }
                {!loadedBal && <CircularProgress size={34} />}
            </Grid>
        </div>
    )
}