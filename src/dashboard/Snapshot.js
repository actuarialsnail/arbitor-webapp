import React from 'react';
import { requestSnapshot, cancelSnapshotData } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

export default function Snapshot() {
    const [snapshotData, setSnapshotData] = React.useState('no snapshotData yet');
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        console.log('requesting snapshot data');
        requestSnapshot(50, data => {
            // console.log(new Date(), data);
            setSnapshotData(data);
            setLoaded(true);
        });
        return () => {
            cancelSnapshotData();
        }
    }, [])

    return (
        <React.Fragment>
            {loaded && snapshotData.map((arbObj) => {
                const key = arbObj.route.join('-');
                const mktSize = arbObj.mktSize.join('*');
                const accSize = arbObj.accSize.join('*');
                const timestamp = arbObj.timestamp;
                const return_pc = ((arbObj.price.slice(-1)[0] - 1) * 100);
                const timestamp_webapp = new Date(arbObj.timestamp.slice(-1)[0]);
                return (
                    <Card key={key}>
                        <CardContent>
                            <Typography>
                                {key}
                            </Typography>
                            <Typography>
                                Return {return_pc.toFixed(1)}%
                            </Typography>
                            <Typography>
                                refValue: {arbObj.refValue}
                            </Typography>
                            <Typography>
                                refMult: {arbObj.refMult}
                            </Typography>
                            <Typography>
                                mktSize: {mktSize}
                            </Typography>
                            <Typography>
                                accSize: {accSize}
                            </Typography>
                            <Typography>
                                timestamp: {timestamp.map(time => {
                                let ts = new Date(time)
                                return '*' + ts.toJSON().slice(11, 19) + '*'
                            })}
                            </Typography>
                            <Typography>
                                {timestamp_webapp.toJSON().slice(11, 19)}
                            </Typography>
                        </CardContent>
                    </Card>
                )
            })}
        </React.Fragment>
    )

}