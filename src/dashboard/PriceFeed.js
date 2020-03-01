import React from 'react';
import { requestPriceData } from '../api';
import Typography from '@material-ui/core/Typography';

export default function PriceFeed() {
    const [priceData, setPriceData] = React.useState('no priceData yet');
    React.useEffect(() => {
        requestPriceData((priceData) => {
            setPriceData(priceData);
            console.log(priceData);
        });
    }, [])

    return (
        
        <Typography component="h5" variant="body2" color="inherit">{}</Typography>

    )



}