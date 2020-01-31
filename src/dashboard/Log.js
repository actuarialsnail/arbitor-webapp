import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import {BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts'
import Badge from '@material-ui/core/Badge';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';

const data = [
  {name: 'BTC (before)', coinfloor: 4000, coinbase: 2400, kraken: 2400, binance: 2400},
  {name: 'BTC (after)',  coinfloor: 4100, coinbase: 2300, kraken: 2000, binance: 2800},
];

const styles = theme => ({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
});

const DialogTitle = withStyles(styles)(props => {
    const { children, classes, onClose, ...other } = props;
    return (
      <MuiDialogTitle disableTypography className={classes.root} {...other}>
        <Typography variant="h6">{children}</Typography>
        {onClose ? (
          <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
});

const DialogContent = withStyles(theme => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);
  
const DialogActions = withStyles(theme => ({
    root: {
      margin: 0,
      padding: theme.spacing(1),
    },
}))(MuiDialogActions);

export default function Log(props) {
    const [open, setOpen] = React.useState(false);
    const [tabValue, setTabValue] = React.useState(0);
    const [tabDisabled, setTabDisabled] = React.useState(true);
    const [badgeVisible, setBadgeVisible] = React.useState(true);

  
    const handleClickOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      setOpen(false);
    };

    const handleTabChange = (event, newValue) => {
      setTabValue(newValue)
    }

    React.useEffect(() => {
      // console.log(props);
      if(JSON.stringify(props.executionLog) === '{}'){
        setBadgeVisible(false);
        setTabDisabled(true);
      } else {
        setBadgeVisible(true);
        setTabDisabled(false);
      }
    },[props])
    
    return (
      <div>
        <Button variant="outlined" color="primary" onClick={handleClickOpen}>
          <Badge color="secondary" variant="dot" invisible={!badgeVisible}>
            <MenuIcon />
          </Badge>
        </Button>
        <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open} >
          <DialogTitle id="customized-dialog-title" onClose={handleClose}>
            {props.verificationLog.tradeObj.route.join(' ')}
          </DialogTitle>
          <DialogContent dividers>
            <Paper elevation={0} >
              <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" centered >
                <Tab label="Verification"></Tab>
                <Tab label="Execution" disabled={tabDisabled}></Tab>
              </Tabs>
              <TabPanel value={tabValue} data={props}>             
              </TabPanel>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
}

function TabPanel(props){
  const { value, data, ...other } = props;
  const executionLogFilter = (log) => {
    if (log === null || log === undefined || Object.keys(log).length === 0){
      return "";
    } else {
      let chartData = []; 
      let list = [];
      let prior = {};
      let post = {};
      
      Object.keys(log.balancePrior).forEach(exchange=>{  
        Object.keys(log.balancePrior[exchange]).forEach(currency=>{
          if (typeof prior[currency] === "undefined") {
            prior[currency] = {};
            list.push(currency)
          }
          prior[currency][exchange] = log.balancePrior[exchange][currency];
        })
      })

      Object.keys(log.balancePost).forEach(exchange=>{  
        Object.keys(log.balancePost[exchange]).forEach(currency=>{
          if (typeof post[currency] === "undefined") {
            post[currency] = {};
            list.push(currency)
          }
          post[currency][exchange] = log.balancePost[exchange][currency];
        })
      })

      list = Array.from(new Set(list));
      list.forEach((value) => {
        chartData.push([
          { name: value + ' Prior', ...prior[value]},
          { name: value + ' Post', ...post[value]}
        ])
      })
      
      return (    
        <div>
          <br />
          <Typography>
            Exucution log
            {log.timestamp}
          </Typography>
          <Typography>
            Trade request
          </Typography>
          <div><pre>{JSON.stringify(log.orderParams, null, 2)}</pre></div>
          
          <Typography>
            Trade response
          </Typography>
          
          <div><pre>{JSON.stringify(log.tradeRes, null, 2)}</pre></div>
          
          {chartData.map((item)=>{
            return (
            <BarChart width={250} height={200} data={item} key={item[0].name+' '+item[1].name}
                  margin={{top: 20, right: 30, left: 20, bottom: 5}}>
              <XAxis dataKey="name"/>
              <Tooltip/>
              <Bar dataKey="coinfloor" stackId="a" fill="#8884d8" />
              <Bar dataKey="coinbase" stackId="a" fill="#82ca9d" />
              <Bar dataKey="kraken" stackId="a" fill="#82ds9d" />
              <Bar dataKey="binance" stackId="a" fill="#12ca9d" />
            </BarChart>)
          })}
          
        </div>
      );
    }
  };

  switch(value){
    case 0:
      return(
        <div>
          <br />
          <Typography gutterBottom>
            Time of verification 
            {data.verificationLog.timestamp}
          </Typography>
          <Typography>
            Orderbook data 
          </Typography>
          <div><pre>{JSON.stringify(data.verificationLog.orderbookData, null, 2)}</pre></div>  
        </div> 
      );
    case 1:
      return(
        <div>
          {executionLogFilter(data.executionLog)}
        </div>
      );
    
    default :
      //code block
      return (<div></div>)
  }  
}

// export default function SimplePaper() {
//     const classes = useStyles();

//     const [dialogOpen, setDialogOpen] = React.useState(false);

//     const handleOpen = () => {
//         setDialogOpen(true);
//     };

//     const handleClose = () => {
//         setDialogOpen(false);
//     };

//     return (
//         <div>
//         <Button onClick={handleOpen}>
//                     <MenuIcon />
//                   </Button>
//         <Dialog
//             className={classes.root}  
//             open={dialogOpen}
//             onClose={handleClose}
//         >
//             <DialogTitle id="simple-dialog-title">Set backup account</DialogTitle>
//             <Paper>
//                 <Button color="primary" onClick={handleClose}>Close</Button>
//             </Paper>
//         </Dialog>
//         </ div>
//     );
// }