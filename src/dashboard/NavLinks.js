import React from 'react';
import { Link } from 'react-router-dom';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AssignmentIcon from '@material-ui/icons/Assignment';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import RssFeedIcon from '@material-ui/icons/RssFeed';
import BuildIcon from '@material-ui/icons/Build';

export const mainListItems = (
  <div>
    <ListItem button component={Link} to="/summary">
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Summary" />
    </ListItem>
    <ListItem button component={Link} to="/logopportunity">
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Opportunity Logs" />
    </ListItem>
    <ListItem button component={Link} to="/logvalidation">
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Validation Logs" />
    </ListItem>
    <ListItem button component={Link} to="/logtrade">
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
    <ListItem button component={Link} to="/snapshot">
      <ListItemIcon>
        <RssFeedIcon />
      </ListItemIcon>
      <ListItemText primary="Snapshot" />
    </ListItem>
    <ListItem button component={Link} to="/tooldca">
      <ListItemIcon>
        <BuildIcon />
      </ListItemIcon>
      <ListItemText primary="DCA Tool" />
    </ListItem>
    <ListItem button component={Link} to="/toolrebalance">
      <ListItemIcon>
        <BuildIcon />
      </ListItemIcon>
      <ListItemText primary="Trade Tool" />
    </ListItem>
    <ListItem button component={Link} to="/openorders">
      <ListItemIcon>
        <BuildIcon />
      </ListItemIcon>
      <ListItemText primary="Current Orders" />
    </ListItem>
  </div>
);