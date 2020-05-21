import React from 'react';
import { requestStreamData, cancelStreamData } from '../api';
import { requestBalanceData, cancelBalanceListener } from '../api';
import { sendOrderParams, cancelOrdersParamsListener } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Avatar from '@material-ui/core/Avatar';

import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
    },
    card: {
        minWidth: 500,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 200,
    },
    textBox: {
        justifyContent: 'left',
        display: 'flex',
        width: '500px',
    },
    textBlue: {
        width: '80px',
        verticalAlign: 'middle',
        color: '#3F51B5',
    },
    textRed: {
        width: '80px',
        verticalAlign: 'middle',
        color: '#B1102F',
    },
    small: {
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        fontSize: '0.75rem',
        margin: '0px 5px'
    },
    slider: {
        width: 200,
    }
}));

export default function TradeTools() {
    const [streamData, setStreamData] = React.useState('no streamData yet');
    const [balanceData, setBalanceData] = React.useState('no balanceData yet');
    const [priceLoaded, setPLoaded] = React.useState(false);
    const [balanceLoaded, setBLoaded] = React.useState(false);
    const [text, setText] = React.useState('');
    const [pairList, setPairList] = React.useState({});
    const [pairSelected, setPairSelected] = React.useState('');
    const [exchangeSelected, setExchangeSelected] = React.useState('');
    const [buysell, setBuysell] = React.useState('buy');
    const [bin, setBin] = React.useState(10);
    const [baseSize, setBaseSize] = React.useState(0.01);
    const [quoteBP, setQuoteBP] = React.useState('');
    const [loading, setLoading] = React.useState(0);
    const [quoteSummary, setSummary] = React.useState({ cost: '' });
    const [tradeRes, setTradeRes] = React.useState('');

    const classes = useStyles();
    React.useEffect(() => {
        let init = true;
        requestStreamData((data) => {
            //console.log(new Date(), data);
            setStreamData(data);
            if (init) {
                setPairList(Object.keys(data));
                setPLoaded(true);
                init = false;
            }
        });
        requestBalanceData('', (data) => {
            setBalanceData(data);
            setBLoaded(true);
        });
        return () => {
            cancelStreamData();
            cancelBalanceListener();
            cancelOrdersParamsListener();
        }
    }, [])

    const handleTextChange = (e) => {
        setText(e.target.value);
        setSummary({ cost: '' });
    }
    const handleBalanceRequest = () => {
        setBLoaded(false);
        requestBalanceData(text, (data) => {
            // console.log(new Date(), data);
            cancelBalanceListener();
            setBalanceData(data);
            setBLoaded(true);
        });
    }
    const handleExchangeChange = (e) => {
        setExchangeSelected(e.target.value);
        requireReset();
    }
    const handlePairChange = (e) => {
        if (exchangeSelected) setExchangeSelected('');
        requireReset();
        setPairSelected(e.target.value);
    }
    const handleBuysellChange = (e) => {
        setBuysell(e.target.value);
        requireReset();
    }
    const handleBinChange = (e) => {
        setBin(e.target.value);
        setSummary({ cost: '' });
    }
    const handleBaseSizeChange = (e) => {
        setBaseSize(e.target.value);
        setSummary({ cost: '' });
    }
    const handleLoadingChange = (e, nextValue) => {
        // console.log(streamData[pairSelected][exchangeSelected]);
        const refPrice = buysell === 'buy' ? streamData[pairSelected][exchangeSelected].asks[0].price : streamData[pairSelected][exchangeSelected].bids[0].price;
        const boundaryPrice = Math.floor(buysell === 'buy' ? refPrice * (1 - nextValue / 100) : refPrice * (1 + nextValue / 100));
        setQuoteBP(boundaryPrice);
        setSummary({ cost: '' });
        setLoading(nextValue);
    }
    const handleClearbtnClick = () => {
        setPairList(Object.keys(streamData));
        setExchangeSelected('');
        setPairSelected('');
        setBin(10);
        setBaseSize(0.01);
        setLoading(0);
        setQuoteBP('');
        setSummary({ cost: '' });
    }
    const requireReset = () => {
        setLoading(0);
        setQuoteBP('');
        setSummary({ cost: '' });
    }
    const handleCalcbtnClick = () => {
        const refPrice = buysell === 'buy' ? streamData[pairSelected][exchangeSelected].asks[0].price : streamData[pairSelected][exchangeSelected].bids[0].price;
        let prices = [];
        let cost = 0;
        const stepSize = baseSize / bin;
        const deltaPrice = (quoteBP - refPrice) / bin;
        for (let index = 1; index <= bin; index++) {
            let stepPrice = Math.floor(refPrice + deltaPrice * (index));
            prices.push(stepPrice);
            cost += stepSize * stepPrice;
        }
        cost = Math.round((cost + Number.EPSILON) * 100) / 100;
        setSummary({ prices, cost, stepSize, text, buysell, pairSelected, exchangeSelected });
        setTradeRes('');
    }
    const handleSubmitbtnClick = () => {
        setTradeRes('');
        sendOrderParams(quoteSummary, (res) => {
            console.log(res);
            setTradeRes(res);
            cancelOrdersParamsListener();
        });
    }

    return (
        <div className={classes.root}>
            <Card className={classes.card}>
                <CardContent>
                    <Typography variant="h5" component="h2">
                        Exchange funds rebalance
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button>Preview</Button>
                    <Button>Clear</Button>
                    <Button>Submit</Button>
                </CardActions>
            </Card>
        </div>)

}