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
                        case "coinbase": case "coinfloor":
                            return (
                                orders.map(order => {
                                    return (
                                        <div key={order.id}>
                                            <Typography>{exchange}: {order.id}</Typography>
                                            <pre>{JSON.stringify(order, null, 4)}</pre>
                                            <Button variant="outlined" color="primary" onClick={handleCancelOrderRequest({ id: order.id, exchange, ...orders })}>
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
    )
}