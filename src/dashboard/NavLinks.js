import React from 'react';
import { Link } from 'react-router-dom';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AssignmentIcon from '@material-ui/icons/Assignment';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import RssFeedIcon from '@material-ui/icons/RssFeed';

export const mainListItems = (
  <div>
    <ListItem button component={Link} to="/summary">
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Summary" />
    </ListItem>
    <ListItem button component={Link} to="/opports">
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Trade Logs" />
    </ListItem>
    <ListItem button component={Link} to="/balance">
      <ListItemIcon>
        <AccountCircleIcon />
      </ListItemIcon>
      <ListItemText primary="Balances" />
    </ListItem>
    <ListItem button component={Link} to="/pricefeed">
      <ListItemIcon>
        <RssFeedIcon />
      </ListItemIcon>
      <ListItemText primary="Price Feeds" />
    </ListItem>
  </div>
);