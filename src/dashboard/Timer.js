import React from 'react';
import { subscribeToTimer } from '../api';
import Typography from '@material-ui/core/Typography';

export default function Timer() {
    const [timestamp, setTimestamp] = React.useState('no timestamp yet');
    React.useEffect(() => {
        subscribeToTimer((err, timestamp) => {
          setTimestamp(timestamp)
        });
      }, [])

    return (
        <Typography component="h5" variant="body2" color="inherit">{timestamp}</Typography>
    )
}