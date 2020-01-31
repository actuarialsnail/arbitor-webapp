import React from 'react';
import logo from './logo.svg';
import './App.css';
import Dashboard from './dashboard/Dashboard';

class App extends React.Component {

  constructor(props) {
    super(props);
    
  }
  render(){
    return (
      <Dashboard></Dashboard>
    );
  }
}

export default App;
