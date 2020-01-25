import React from 'react';
import logo from './logo.svg';
import './App.css';
import { subscribeToTimer } from './api';
import Dashboard from './dashboard/Dashboard';

class App extends React.Component {

  constructor(props) {
    super(props);
    subscribeToTimer((err, timestamp) => this.setState({ 
      timestamp
    }));
  }
  
  state = {
    timestamp: 'no timestamp yet',
  };

  render(){
    return (
      <Dashboard timestamp={this.state.timestamp}></Dashboard>
    );
  }
}

export default App;
