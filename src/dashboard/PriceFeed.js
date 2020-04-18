import React from 'react';
import { requestStreamData, cancelStreamData } from '../api';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    root: {

    },
    textBox: {
        justifyContent: 'left',
        display: 'flex',
        width: '400px',
    },
    textBody: {
        margin: '0px 5px'
    },
    textBid: {
        width: '100px',
        verticalAlign: 'middle',
        color: '#3F51B5',
    },
    textAsk: {
        width: '100px',
        verticalAlign: 'middle',
        color: '#B1102F',
    },
    textExchange: {
        width: '100px',
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
}))

export default function PriceFeed() {
    const [streamData, setStreamData] = React.useState('no streamData yet');
    const [loaded, setLoaded] = React.useState(false);
    const classes = useStyles();

    React.useEffect(() => {
        requestStreamData((data) => {
            //console.log(new Date(), data);
            setStreamData(data);
            setLoaded(true);
        });
        return () => {
            cancelStreamData();
        }
    }, [])

    return (
        <React.Fragment>
            <Grid container spacing={3}>{
                loaded && Object.keys(streamData).map(pair => {
                    return (
                        <Grid item xs={12} sm={12} md={6} lg={4} xl={3} key={pair}>
                            <Card>
                                <CardContent>
                                    <Typography component="h2" variant="h5" color="inherit">{pair}</Typography>
                                    {
                                        Object.keys(streamData[pair]).map(exchange => {
                                            return (
                                                <div className={classes.textBox} key={pair + exchange} >
                                                    <Typography variant="body2" className={classes.textExchange}>
                                                        {exchange}
                                                    </Typography>
                                                    <Avatar className={classes.small}>B</Avatar>
                                                    <Typography variant="body2" className={classes.textBid}>
                                                        {('bids' in streamData[pair][exchange]) ? streamData[pair][exchange].bids[0].price : console.log('Error', pair, exchange, streamData[pair][exchange])}
                                                    </Typography>
                                                    <Avatar className={classes.small}>A</Avatar>
                                                    <Typography variant="body2" className={classes.textAsk}>
                                                        {('asks' in streamData[pair][exchange]) ? streamData[pair][exchange].asks[0].price : console.log('Error', pair, exchange, streamData[pair][exchange])}
                                                    </Typography>
                                                </div>
                                            )
                                        })
                                    }
                                </CardContent>
                            </Card>
                        </Grid>
                    )
                })
            }</Grid>
        </React.Fragment>
    )



}