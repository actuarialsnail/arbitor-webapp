import React from 'react';
import { requestStreamData, cancelStreamData } from '../api';
import { requestBalanceData, cancelBalanceListener } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
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
import { findByLabelText } from '@testing-library/react';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 200,
    },
    textBox: {
        justifyContent: 'left',
        display: 'flex',
        width: '400px',
    },
    textBlue: {
        width: '100px',
        verticalAlign: 'middle',
        color: '#3F51B5',
    },
    textRed: {
        width: '100px',
        verticalAlign: 'middle',
        color: '#B1102F',
    },
    textPair: {
        width: '150px',
        verticalAlign: 'middle',
        color: '#808080',
        fontWeight: '600',
    },
    small: {
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        fontSize: '0.75rem',
        margin: '0px 5px'
    },
}));

export default function TradeTools() {
    const [streamData, setStreamData] = React.useState('no streamData yet');
    const [balanceData, setBalanceData] = React.useState('no balanceData yet');
    const [priceLoaded, setPLoaded] = React.useState(false);
    const [balanceLoaded, setBLoaded] = React.useState(false);
    const [text, setText] = React.useState('');

    const classes = useStyles();
    React.useEffect(() => {
        requestStreamData((data) => {
            //console.log(new Date(), data);
            setStreamData(data);
            setPLoaded(true);
        });
        requestBalanceData('', (data) => {
            //console.log(new Date(), data);
            setBalanceData(data);
            setBLoaded(true);
        });
        return () => {
            cancelStreamData();
            cancelBalanceListener();
        }
    }, [])

    const handleExchangeChange = (e) => {

    }

    const handlePairChange = (e) => {

    }

    const handleBuysellChange = (e) => {

    }

    return (
        <div className={classes.root}>
            <Card>
                <CardContent>
                    <Typography variant="h5" component="h2">
                        Dollar cost averaging
                    </Typography>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="exchange-select-label">Exchange</InputLabel>
                        <Select
                            labelId="exchange-select-label"
                            id="exchange-select"
                            value={10}
                            onChange={handleExchangeChange}
                        >
                            <MenuItem value={10}>Ten</MenuItem>
                            <MenuItem value={20}>Twenty</MenuItem>
                            <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="pair-select-label">Pair</InputLabel>
                        <Select
                            labelId="pair-select-label"
                            id="pair-select"
                            value='pair1'
                            onChange={handlePairChange}
                        >
                            <MenuItem value={10}>Ten</MenuItem>
                            <MenuItem value={20}>Twenty</MenuItem>
                            <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                    </FormControl>
                    <div className={classes.textBox}>
                        <Typography variant="body2" className={classes.textPair}>
                            Pair
                        </Typography>
                        <Avatar className={classes.small}>B</Avatar>
                        <Typography variant="body2" className={classes.textBlue}>
                            {/* {('bids' in streamData[pair][exchange]) ? streamData[pair][exchange].bids[0].price : console.log('Error', pair, exchange, streamData[pair][exchange])} */}
                        </Typography>
                        <Avatar className={classes.small}>A</Avatar>
                        <Typography variant="body2" className={classes.textRed}>
                            {/* {('asks' in streamData[pair][exchange]) ? streamData[pair][exchange].asks[0].price : console.log('Error', pair, exchange, streamData[pair][exchange])} */}
                        </Typography>
                    </div>
                    <div className={classes.textBox}>
                        <Typography variant="body2" className={classes.textPair}>
                            Product 1 Balance
                        </Typography>
                        <Typography variant="body2" className={classes.textBlue}>
                            {/* {('bids' in streamData[pair][exchange]) ? streamData[pair][exchange].bids[0].price : console.log('Error', pair, exchange, streamData[pair][exchange])} */}
                        </Typography>
                    </div>
                    <div className={classes.textBox}>
                        <Typography variant="body2" className={classes.textPair}>
                            Product 2 Balance
                        </Typography>
                        <Typography variant="body2" className={classes.textBlue}>
                            {/* {('bids' in streamData[pair][exchange]) ? streamData[pair][exchange].bids[0].price : console.log('Error', pair, exchange, streamData[pair][exchange])} */}
                        </Typography>
                    </div>
                    <FormControl>
                        <RadioGroup aria-label="buysell" name="buysell1" value={'buy'} onChange={handleBuysellChange}>
                            <FormControlLabel value="Buy" control={<Radio />} label="Buy" />
                            <FormControlLabel value="Sell" control={<Radio />} label="Sell" />
                        </RadioGroup>
                    </FormControl>
                    
                    <FormControl className={classes.formControl}>
                        <InputLabel id="bin-select-label">Bin size</InputLabel>
                        <Select
                            labelId="bin-select-label"
                            id="bin-select"
                            value='pair1'
                            onChange={handlePairChange}
                        >
                            <MenuItem value={10}>Ten</MenuItem>
                            <MenuItem value={20}>Twenty</MenuItem>
                            <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="size-select-label">Total size</InputLabel>
                        <Select
                            labelId="size-select-label"
                            id="size-select"
                            value='pair1'
                            onChange={handlePairChange}
                        >
                            <MenuItem value={10}>Ten</MenuItem>
                            <MenuItem value={20}>Twenty</MenuItem>
                            <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="price-loading-label">Price loading</InputLabel>
                        <Select
                            labelId="price-loading-label"
                            id="price-loading"
                            value='pair1'
                            onChange={handlePairChange}
                        >
                            <MenuItem value={10}>Ten</MenuItem>
                            <MenuItem value={20}>Twenty</MenuItem>
                            <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                    </FormControl>
                    <div>

                        <Slider></Slider>
                    </div>
                </CardContent>
                <CardActions>
                    <Button size="small">Preview</Button>
                </CardActions>
            </Card>
        </div>)

}