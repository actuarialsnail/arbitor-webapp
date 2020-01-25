import React from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import MenuIcon from '@material-ui/icons/Menu';
import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import Title from './Title';
import { requestTradeLogs } from '../api';
import { Typography } from '@material-ui/core';

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

export default class Orders extends React.Component {

  constructor(props) {
    super(props);
    requestTradeLogs((err, tradeLogs) => {
      let tradeLogs_verification = [], tradeLogs_execution = [];
      tradeLogs.forEach( (log) => {
        if (log.type === 'verification'){
          tradeLogs_verification.push(log);
        }
        
        if (log.type === 'execution'){
          tradeLogs_execution.push(log);
        }

        this.setState({tradeLogs_verification, tradeLogs_execution});
      })
    });
  }

  state = {
    tradeLogs_verification: null,
    tradeLogs_execution: null,
    modal_open: false
  };

  handleOpen = () => {
    this.setState({modal_open: true});
  }

  handleClose = () => {
    this.setState({modal_open: false});
  }

  formatCell(arr){
    let formattedArr = []
    arr.forEach( (value) => {
      formattedArr.push(Number.parseFloat(value).toFixed(6));
    })
    return formattedArr
  }

  render(){
    //const classes = useStyles();
    if (!this.state.tradeLogs_verification) {
      return <div />
    }
    
    return (
      <React.Fragment>
        {console.log(this.state)}
        
        <Title>Trade Logs</Title>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Route</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>MktSize</TableCell>
              <TableCell>AccSize</TableCell>
              <TableCell align="right">Net Balance</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { 
            this.state.tradeLogs_verification.map(row => (
              <TableRow key={row.tradeObj.route.join(':')+row.timestamp}>
                <TableCell>{row.tradeObj.route.join('\n')}</TableCell>
                <TableCell>{this.formatCell(row.tradeObj.price).join('\n')}</TableCell>
                <TableCell>{this.formatCell(row.tradeObj.mktSize).join('\n')}</TableCell>
                <TableCell>{this.formatCell(row.tradeObj.accSize).join('\n')}</TableCell>
                <TableCell align="right">{Number.parseFloat(row.tradeObj.balanceFilteredValue).toFixed(8)}</TableCell>
                <TableCell>
                  <Button onClick={this.handleOpen}>
                    <MenuIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))
            }
          </TableBody>
        </Table>
        <Modal
          open={this.state.modal_open}
          onClose={this.handleClose}
        >
          <Paper>
            <Typography>Test</Typography>
          </Paper>
        </Modal>
        <div >
          <Link color="primary" href="#" onClick={preventDefault}>
            See more orders
          </Link>
        </div>
      </React.Fragment>
    );
  }
}