import React from 'react';
import { requestSnapshot, cancelSnapshotData } from '../api';

export default function Snapshot() {
    const [snapshotData, setSnapshotData] = React.useState('no snapshotData yet');

    React.useEffect(() => {
        console.log('requesting snapshot data');
        requestSnapshot(50, data => {
            // console.log(new Date(), data);
            setSnapshotData(data);
            // setLoaded(true);
        });
        return () => {
            cancelSnapshotData();
        }
    }, [])

    return (
        <div>
            Test
            {console.log(snapshotData.length)}
        </div>
    )

}