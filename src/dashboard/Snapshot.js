import React from 'react';
import { requestSnapshot, cancelSnapshotData } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

const useStyles = makeStyles({
  card: {
    marginBottom: "1rem",
    width: 700,
  },
  table: {
    minWidth: 600,
  },
});

export default function Snapshot() {
  const [snapshotData, setSnapshotData] = React.useState('no snapshotData yet');
  const [loaded, setLoaded] = React.useState(false);
  const classes = useStyles();
  React.useEffect(() => {
    // console.log('requesting snapshot data');
    requestSnapshot(10, data => {
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
        const return_pc = ((arbObj.price.slice(-1)[0] - 1) * 100);
        return (
          <Card key={key} className={classes.card}>
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
              <TableContainer>
                <Table className={classes.table} size="small" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell>route</TableCell>
                      <TableCell align="right">price</TableCell>
                      <TableCell align="right">mktSize</TableCell>
                      <TableCell align="right">accSize</TableCell>
                      <TableCell>timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {arbObj.timestamp.map((time, index) => (
                      <TableRow key={key + arbObj.route[index]}>
                        <TableCell>{arbObj.route[index]}</TableCell>
                        <TableCell align="right">{Number(arbObj.price[index]).toFixed(6)}</TableCell>
                        <TableCell align="right">{Number(arbObj.mktSize[index]).toFixed(6)}</TableCell>
                        <TableCell align="right">{Number(arbObj.accSize[index]).toFixed(6)}</TableCell>
                        <TableCell >{((Date.now() - time) / 1000).toFixed(0)}s ago</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )
      })}
    </React.Fragment>
  )

}