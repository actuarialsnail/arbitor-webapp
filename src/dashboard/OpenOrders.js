import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import { requestOpenOrdersData, cancelOpenOrdersListener, requestCancelOrder, cancelCancelOrderListener } from '../api';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

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

export default function OrdersView() {
    const classes = useStyles();
    const [openOrders, setOpenOrdersData] = React.useState('no orders data yet');
    const [loaded, setLoaded] = React.useState(false);
    const [text, setText] = React.useState('');
    const [cancelReq, setCancelReq] = React.useState('');
    const [popupOpen, setPopupOpen] = React.useState(false);

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleOpenOrdersRequest = () => {
        requestOpenOrdersData(text, data => {
            cancelOpenOrdersListener();
            // console.log(data);
            setOpenOrdersData(data);
            setLoaded(true);
        })
    }

    const handleCancelOrderRequest = (data) => (event) => {
        let reqObj = { order: data, text };
        // console.log(reqObj);
        requestCancelOrder(reqObj, res => {
            cancelCancelOrderListener();
            // console.log(res);
            setCancelReq(JSON.stringify(res, null, 4));
            setPopupOpen(true);
            handleOpenOrdersRequest();
        })
    }

    const handlePopupClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setPopupOpen(false);
    };

    return (
        <div className={classes.root}>
            <TextField onChange={handleTextChange} />
            <Button variant="outlined" color="primary" onClick={handleOpenOrdersRequest}>
                Request open orders
            </Button>
            {
                loaded && Object.keys(openOrders).map(exchange => {
                    const orders = openOrders[exchange];

                    switch (exchange) {
                        case "kraken":
                            return (
                                Object.keys(orders.result.open).map(id => {
                                    return (
                                        <div key={id}>
                                            <Typography>{exchange}: {id}</Typography>
                                            <pre>{JSON.stringify(orders.result.open[id], null, 4)}</pre>
                                            <Button variant="outlined" color="primary" onClick={handleCancelOrderRequest({ id, exchange, ...orders.result.open[id] })}>
                                                Cancel order
                                            </Button>
                                            <br />
                                            <Divider />
                                        </div>
                                    )
                                })
                            )
                        case "binance":
                            return (
                                orders.map(order => {
                                    return (
                                        <div key={order.orderId}>
                                            <Typography>{exchange}: {order.orderId}</Typography>
                                            <pre>{JSON.stringify(order, null, 4)}</pre>
                                            <Button variant="outlined" color="primary" onClick={handleCancelOrderRequest({ id: order.orderId, exchange, ...order })}>
                                                Cancel order
                                            </Button>
                                            <br />
                                            <Divider />
                                        </div>
                                    )
                                })
                            )
                        case "coinbase":
                            return (
                                <div key={'coinbase-orders'}>
                                    <Typography>{exchange}</Typography>
                                    <CoinbaseOpenOrders orders={orders} handleCancelOrderRequest={handleCancelOrderRequest} />
                                </div>
                            )
                        case "coinfloor":
                            return (
                                orders.map(order => {
                                    return (
                                        <div key={order.id}>
                                            <Typography>{exchange}: {order.id}</Typography>
                                            <pre>{JSON.stringify(order, null, 4)}</pre>
                                            <Button variant="outlined" color="primary" onClick={handleCancelOrderRequest({ id: order.id, exchange, ...order })}>
                                                Cancel order
                                            </Button>
                                            <br />
                                            <Divider />
                                        </div>
                                    )
                                })

                            )
                        default:
                            return (
                                <div key={exchange}>
                                    <Typography>{exchange}</Typography>
                                    <pre>{JSON.stringify(orders, null, 4)}</pre>
                                    <br />
                                    <Divider />
                                </div>
                            )
                    }

                })
            }
            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={popupOpen}
                autoHideDuration={10000}
                onClose={handlePopupClose}
                message={cancelReq}
                action={
                    <IconButton size="small" aria-label="close" color="inherit" onClick={handlePopupClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />

        </div>
    );
}

function CoinbaseOpenOrders(props) {
    const classes = useStyles();
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const ordersFormatting = (ordersArr) => {
        let orderObj = {};
        // sort by price
        ordersArr.sort((a, b) => {
            return Number(a.price) - Number(b.price);
        })
        // console.log(ordersArr);
        // by product
        ordersArr.forEach(order => {
            if (!orderObj[order.product_id]) {
                orderObj[order.product_id] = []
            }
            orderObj[order.product_id].push(order)
        })
        return orderObj;
    };

    const orders_by_product = ordersFormatting(props.orders);

    const hcOptions = (productOrders) => {
        const seriesData = productOrders.map(order => {
            return [Number(order.price), Number(order.size)];
        })
        let options = {
            chart: {
                type: 'column',
            },
            credits: {
                enabled: false
            },
            xAxis: {
                title: {
                    text: 'Price'
                }
            },
            yAxis: {
                title: {
                    text: 'Size'
                }
            },
            title: {
                text: ''
            },
            legend: {
                enabled: false
            },
            tooltip: {
                headerFormat: '<span style="font-size=10px;">Price: {point.key}</span><br/>',
                valueDecimals: 4
            },
            series: [{
                name: 'Limit orders',
                data: seriesData,
            }]
        }
        return options;
    }

    const handleDialogOpen = () => {
        setDetailsOpen(!detailsOpen);
    }

    return (
        <div >
            {
                Object.keys(orders_by_product).map(product => {
                    return (
                        <ExpansionPanel key={product}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography >{product}</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <Grid container spacing={3}>
                                    <Grid item lg={12}>
                                        <HighchartsReact highcharts={Highcharts} options={hcOptions(orders_by_product[product])} />
                                    </Grid>
                                    <Grid item lg={12}>
                                        {
                                            orders_by_product[product].map(order => {
                                                return (
                                                    <Box key={order.id} className={classes.root}>
                                                        <Typography>{order.id}: price: {order.price} size: {order.size} </Typography>

                                                        <Button variant="outlined" color="primary" onClick={props.handleCancelOrderRequest({ id: order.id, exchange: 'coinbase', ...order })}>
                                                            Cancel order
                                                        </Button>
                                                        <Button variant="outlined" color="primary" onClick={handleDialogOpen}>
                                                            Toggle details
                                                        </Button>
                                                        {detailsOpen && <pre>{JSON.stringify(order, null, 4)}</pre>}
                                                        <Divider />
                                                    </Box>
                                                )
                                            })
                                        }
                                    </Grid>
                                </Grid>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    )
                })
            }
        </div>
    );
}