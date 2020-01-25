import React from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from './Title';
import { requestTradeLogs } from '../api';
import { Typography } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import Button from '@material-ui/core/Button';
import Log from './Log'

// Generate Order Data
function createData(id, date, name, shipTo, paymentMethod, amount) {
  return { id, date, name, shipTo, paymentMethod, amount };
}

const rows = [
  createData(0, '16 Mar, 2019', 'Elvis Presley', 'Tupelo, MS', 'VISA ⠀•••• 3719', 312.44),
  createData(1, '16 Mar, 2019', 'Paul McCartney', 'London, UK', 'VISA ⠀•••• 2574', 866.99),
  createData(2, '16 Mar, 2019', 'Tom Scholz', 'Boston, MA', 'MC ⠀•••• 1253', 100.81),
  createData(3, '16 Mar, 2019', 'Michael Jackson', 'Gary, IN', 'AMEX ⠀•••• 2000', 654.39),
  createData(4, '15 Mar, 2019', 'Bruce Springsteen', 'Long Branch, NJ', 'VISA ⠀•••• 5919', 212.79),
];

function preventDefault(event) {
  event.preventDefault();
}

const useStyles = makeStyles(theme => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
}));

export default function Orders() {
  const classes = useStyles();
  const [tradeLogs, setTradeLogs] = React.useState(null);
  
  const formatCell = (arr) => {
    let formattedArr = []
    arr.forEach( (value) => {
      formattedArr.push(Number.parseFloat(value).toFixed(6));
    })
    return formattedArr;
  }

  React.useEffect(() => {
    requestTradeLogs((err, tradeLogs) => {
      let filteredLogs = []
      tradeLogs.forEach( (log) => {
        if (log.type === 'verification'){
          filteredLogs.push(log);
        }
        
        // if (log.type === 'execution'){
        //   tradeLogs_execution.push(log);
        // }

        // this.setState({tradeLogs_verification, tradeLogs_execution});
        setTradeLogs(filteredLogs);
      })
    });
  }, []);

  if (!tradeLogs) {
    return <div />
  }

  return (
    <React.Fragment>
      <Title>Recent Orders</Title>
      <Table size="small">
        {console.log(tradeLogs)}
        <TableHead>
          <TableRow>
            <TableCell>Route</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Market</TableCell>
            <TableCell>Account</TableCell>
            <TableCell align="right">Profit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tradeLogs.map(row => (
              <TableRow key={row.tradeObj.route.join(':')+row.timestamp}>
                <TableCell>{row.tradeObj.route.join('\n')}</TableCell>
                <TableCell>{formatCell(row.tradeObj.price).join('\n')}</TableCell>
                <TableCell>{formatCell(row.tradeObj.mktSize).join('\n')}</TableCell>
                <TableCell>{formatCell(row.tradeObj.accSize).join('\n')}</TableCell>
                <TableCell align="right">{Number.parseFloat(row.tradeObj.balanceFilteredValue).toFixed(8)}</TableCell>
                <TableCell>
                  <Log tradeLog={row}></Log>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className={classes.seeMore}>
        <Link color="primary" href="#" onClick={preventDefault}>
          See more orders
        </Link>
      </div>
    </React.Fragment>
  );
}
