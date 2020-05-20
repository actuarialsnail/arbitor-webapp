import React from 'react';
import './App.css';
import LogValidation from './dashboard/LogValidation';
import LogTrade from './dashboard/LogTrade';
import PriceFeed from './dashboard/PriceFeed';
import BalanceView from './dashboard/BalanceView';
import TradeTools from './dashboard/TradeTools';
import Snapshot from './dashboard/Snapshot';
import CssBaseline from '@material-ui/core/CssBaseline';
import Frame from './dashboard/Frame';
import { makeStyles } from '@material-ui/core/styles';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
}));

export default function App() {
  const classes = useStyles();
  return (
    <React.Fragment>
      <BrowserRouter>
      <div className={classes.root}>
        <CssBaseline />
        <Frame />
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <Container maxWidth="xl" className={classes.container}>
            <Paper className={classes.paper}>
              <Switch>
                <Route path="/summary">
                  <Summary />
                </Route>
                <Route path="/logvalidation">
                  <LogValidation />
                </Route>
                <Route path="/logtrade">
                  <LogTrade />
                </Route>
                <Route path="/pricefeed">
                  <PriceFeed />
                </Route>
                <Route path="/balance">
                  <BalanceView />
                </Route>
                <Route path="/tradetools">
                  <TradeTools />
                </Route>
                <Route path="/snapshot">
                  <Snapshot />
                </Route>
                <Route path="/">
                  <Home />
                </Route>
              </Switch>
            </Paper>
          </Container>
        </main>
      </div>
      </BrowserRouter>
    </React.Fragment>
  );
}

function Home() {
  return <div></div>;
}

function Summary() {
  return <h2>Summary</h2>;
}