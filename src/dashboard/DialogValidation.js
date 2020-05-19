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
import Badge from '@material-ui/core/Badge';
import Paper from '@material-ui/core/Paper';

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
    minWidth: '500px',
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
  const [badgeVisible, setBadgeVisible] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    setBadgeVisible(props.validationLog.status);
  }, [props])

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        <Badge color="secondary" variant="dot" invisible={!badgeVisible}>
          <MenuIcon />
        </Badge>
      </Button>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open} >
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          {props.validationLog.route.map((v, i) => { return (<div key={i}>{v}</div>) })}
        </DialogTitle>
        <DialogContent dividers>
          <Paper elevation={0} >
            <Typography gutterBottom>
              Time of verification {new Date(props.validationLog.timestamp.slice(-1)[0]).toTimeString().slice(0, 9)}
            </Typography>
            <Typography gutterBottom>
              Status {props.validationLog.status ? 'true' : 'false'}
            </Typography>
            <Typography>
              Orderbook data
            </Typography>
            <pre>{JSON.stringify(props.validationLog.priceApiData, null, 2)}</pre>
            <Typography>
              Verification 1
            </Typography>
            <pre>{JSON.stringify(props.validationLog.verification1, null, 2)}</pre>
            <Typography>
              Verification 2
            </Typography>
            <pre>{JSON.stringify(props.validationLog.verification2, null, 2)}</pre>
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