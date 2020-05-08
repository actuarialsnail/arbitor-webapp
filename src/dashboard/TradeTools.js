import React from 'react';
import { requestStreamData, cancelStreamData } from '../api';
import { requestBalanceData, cancelBalanceListener } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';

export default function TradeTools() {
    const [streamData, setStreamData] = React.useState('no streamData yet');
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(()=>{

    },[])

}