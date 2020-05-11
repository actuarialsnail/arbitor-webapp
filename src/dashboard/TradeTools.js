import React from 'react';
import { requestStreamData, cancelStreamData } from '../api';
import { requestBalanceData, cancelBalanceListener } from '../api';
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
        }
    }, [])

    const handleTextChange = (e) => {
        setText(e.target.value);
    }
    const handleBalanceRequest = () => {
        setBLoaded(false);
        requestBalanceData(text, (data) => {
            //console.log(new Date(), data);
            setBalanceData(data);
            setBLoaded(true);
        });
    }
    const handleExchangeChange = (e) => {
        setExchangeSelected(e.target.value);
        setLoading(0);
    }
    const handlePairChange = (e) => {
        setPairSelected(e.target.value);
        setLoading(0);
    }
    const handleBuysellChange = (e) => {
        setBuysell(e.target.value);
        setLoading(0);
    }
    const handleBinChange = (e) => {
        setBin(e.target.value);
        setLoading(0);
    }
    const handleBaseSizeChange = (e) => {
        setBaseSize(e.target.value);
        setLoading(0);
    }
    const handleLoadingChange = (e, nextValue) => {
        setLoading(nextValue);
        // console.log(streamData[pairSelected][exchangeSelected]);
        const refPrice = buysell === 'buy' ? streamData[pairSelected][exchangeSelected].asks[0].price : streamData[pairSelected][exchangeSelected].bids[0].price;
        const boundaryPrice = Math.floor(buysell === 'buy' ? refPrice * (1 - nextValue / 100) : refPrice * (1 + nextValue / 100));
        setQuoteBP(boundaryPrice);
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
    const handleCalcbtnClick = () => {
        const refPrice = buysell === 'buy' ? streamData[pairSelected][exchangeSelected].asks[0].price : streamData[pairSelected][exchangeSelected].bids[0].price;
        let interPrice = [];
        let cost = 0;
        const stepSize = baseSize / bin;
        const deltaPrice = (quoteBP - refPrice) / bin;
        for (let index = 1; index <= bin; index++) {
            let stepPrice = Math.floor(refPrice + deltaPrice * (index));
            interPrice.push(stepPrice);
            cost += stepSize * stepPrice;
        }
        cost = Math.round((cost + Number.EPSILON) * 100) / 100;
        setSummary({ interPrice, cost, stepSize });
    }
    const handleSubmitbtnClick = () => {

    }

    return (
        <div className={classes.root}>
            <Card className={classes.card}>
                <CardContent>
                    <Typography variant="h5" component="h2">
                        Dollar cost averaging
                    </Typography>
                    <Typography variant="body1">Live Data</Typography>
                    <Grid container className={classes.textBox}>
                        <Grid item>
                            <Typography variant="body2"> Pair selected: {pairSelected} </Typography>
                        </Grid>
                        <Grid item><Avatar className={classes.small}>B</Avatar></Grid>
                        <Grid item>
                            <Typography variant="body2" className={classes.textBlue}>
                                {pairSelected && exchangeSelected && streamData[pairSelected][exchangeSelected].bids[0].price}
                            </Typography>
                        </Grid>
                        <Grid><Avatar className={classes.small}>A</Avatar></Grid>
                        <Grid item>
                            <Typography variant="body2" className={classes.textRed}>
                                {pairSelected && exchangeSelected && streamData[pairSelected][exchangeSelected].asks[0].price}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item>
                            <Typography variant="body2">
                                Base balance: {balanceLoaded && pairSelected && pairSelected.split('-')[0]}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography variant="body2" className={classes.textBlue}>
                                {balanceLoaded && pairSelected && exchangeSelected && balanceData[exchangeSelected].hasOwnProperty(pairSelected.split('-')[0]) ? balanceData[exchangeSelected][pairSelected.split('-')[0]] : ''}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item>
                            <Typography variant="body2" className={classes.textPair}>
                                Quote balance: {balanceLoaded && pairSelected && pairSelected.split('-')[1]}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography variant="body2" className={classes.textBlue}>
                                {balanceLoaded && pairSelected && exchangeSelected && balanceData[exchangeSelected].hasOwnProperty(pairSelected.split('-')[1]) ? balanceData[exchangeSelected][pairSelected.split('-')[1]] : ''}
                            </Typography>
                        </Grid>
                    </Grid>
                    <br/>
                    <TextField onChange={handleTextChange} />
                    <Button color="primary" onClick={handleBalanceRequest}> Request balance </Button>
                    <div>
                        <FormControl className={classes.formControl}>
                            <InputLabel id="pair-select-label">Pair</InputLabel>
                            <Select
                                labelId="pair-select-label"
                                id="pair-select"
                                value={pairSelected}
                                onChange={handlePairChange}
                            >
                                {priceLoaded && pairList.map(pair => <MenuItem value={pair} key={pair}>{pair}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl} disabled={pairSelected === '' ? true : false}>
                            <InputLabel id="exchange-select-label">Exchange</InputLabel>
                            <Select
                                labelId="exchange-select-label"
                                id="exchange-select"
                                value={exchangeSelected}
                                onChange={handleExchangeChange}
                            >
                                {priceLoaded && pairSelected && Object.keys(streamData[pairSelected]).map(exchange => <MenuItem value={exchange} key={exchange}>{exchange}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </div>
                    <div>
                        <FormControl>
                            <RadioGroup row aria-label="buysell" name="buysell1" value={buysell} onChange={handleBuysellChange}>
                                <FormControlLabel value="buy" control={<Radio size="small" />} label="Buy" />
                                <FormControlLabel value="sell" control={<Radio size="small" />} label="Sell" />
                            </RadioGroup>
                        </FormControl>
                    </div>
                    <div>
                        <FormControl className={classes.formControl}>
                            <InputLabel id="bin-select-label">Bin size</InputLabel>
                            <Select
                                labelId="bin-select-label"
                                id="bin-select"
                                value={bin}
                                onChange={handleBinChange}
                            >
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={20}>20</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <TextField label="Base size (total)" onChange={handleBaseSizeChange} value={baseSize} />
                        </FormControl>
                    </div>
                    <Grid container alignItems="center" spacing={3} >
                        <Grid item>
                            <Typography variant="body1">Loading {loading}%</Typography>
                        </Grid>
                        <Grid item>
                            <Slider max={50} className={classes.slider} value={loading} onChange={handleLoadingChange} aria-labelledby="continuous-slider" disabled={pairSelected && exchangeSelected ? false : true} />
                        </Grid>
                    </Grid>
                    <Typography variant="body1">Quote Boundary Price {quoteBP}</Typography>
                    <Typography variant="body1">Total Quote Price {quoteSummary.cost}</Typography>
                    <pre>{quoteSummary.cost ? JSON.stringify(quoteSummary, null, 4) : ''}</pre>
                </CardContent>
                <CardActions>
                    <Button disabled={pairSelected && exchangeSelected ? false : true} color="primary" onClick={handleCalcbtnClick}>Preview</Button>
                    <Button color="secondary" onClick={handleClearbtnClick}>Clear</Button>
                    <Button onClick={handleSubmitbtnClick}>Submit</Button>
                </CardActions>
            </Card>
        </div>)

}