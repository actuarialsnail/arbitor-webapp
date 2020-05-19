import React from 'react';
import 'date-fns';
// import { makeStyles } from '@material-ui/core/styles';
import Title from './Title';
import { requestLogs, cancelLogsListener } from '../api';
import Grid from '@material-ui/core/Grid';
import DialogValidation from './DialogValidation';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MaterialTable from 'material-table';
import { forwardRef } from 'react';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Paper } from '@material-ui/core';

const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
  Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
  FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
  ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

export default function Opports() {
  const [validationLogs, setValidationLogs] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [loading, setLoading] = React.useState(false);

  const formatCell = (arr) => {
    let formattedArr = []
    arr.forEach((value) => {
      formattedArr.push(Number.parseFloat(value).toFixed(6));
    })
    return formattedArr;
  }

  const handleDateChange = date => {
    setSelectedDate(date);
    setLoading(true);
    let requestDate = date.toJSON().slice(0, 10);
    processValidationLogs(requestDate);
  };

  const processValidationLogs = date => {
    // request data according to date
    // process the logs using callback
    cancelLogsListener();
    requestLogs(date, 'validation', (err, logs) => {
      //logs = tradeLog_dummy; // to remove post testing
      if (err) {
        console.log(err);
        setLoading(false);
        setValidationLogs([]);
        return;
      }
      let validationLogs = [];
      for (const log of logs) {
        if (log.type === 'verification') { validationLogs.push(log) };
      };
      setValidationLogs(validationLogs);
      setLoading(false);
    });

  }

  React.useEffect(() => {
    let today = new Date();
    let requestDate = today.toJSON().slice(0, 10);
    setLoading(true);
    processValidationLogs(requestDate);
    return () => {
      cancelLogsListener();
    }
  }, []);

  if (!validationLogs) {
    return <div />
  }

  return (
    <React.Fragment>
      {/* {console.log(executionLogs)} */}
      <Title>Validation Logs</Title>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DatePicker
              margin="normal"
              id="date-picker-dialog"
              label="Select dates"
              format="dd MMMM yyyy"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </MuiPickersUtilsProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
        </Grid>
      </Grid>
      <br />
      {loading && <CircularProgress size={34} />}
      {!loading &&
        <MaterialTable
          title='Validated opportunities '
          columns={[
            {
              title: 'Time', field: 'timestamp', render: rowData => {
                return (
                  rowData.timestamp.map((v, i) => { return (<div key={i}>{new Date(v).toTimeString().slice(0, 9)}</div>) })
                )
              }, sorting: false
            },
            {
              title: 'Pairs', field: 'route', render: rowData => {
                return (
                  rowData.route.map((v, i) => { return (<div key={i}>{v.split('-')[0] + '-' + v.split('-')[1]}</div>) })
                )
              }, cellStyle: { verticalAlign: "top" }, sorting: false
            },
            {
              title: 'Exchanges', field: 'route', render: rowData => {
                return (
                  rowData.route.map((v, i) => { return (<div key={i}>{v.split('-')[2]}</div>) })
                )
              }, cellStyle: { verticalAlign: "top" }, sorting: false
            },
            {
              title: 'Market', field: 'mktSize', render: rowData => {
                return (
                  formatCell(rowData.mktSize).map((v, i) => { return (<div key={i}>{v}</div>) })
                )
              }, sorting: false
            },
            {
              title: 'Account', field: 'accSize', render: rowData => {
                return (
                  formatCell(rowData.accSize).map((v, i) => { return (<div key={i}>{v}</div>) })
                )
              }, cellStyle: { verticalAlign: "top" }, sorting: false
            },
            {
              title: 'Price', field: 'price', render: rowData => {
                return (
                  formatCell(rowData.price).map((v, i) => { return (<div key={i}>{v}</div>) })
                )
              }, sorting: false
            },
            {
              title: 'Profit', field: 'refValue', render: rowData => {
                return (
                  Number.parseFloat(rowData.refValue).toFixed(6)
                )
              }, defaultSort: 'desc'
            },
            {
              title: 'Details', field: 'route', render: rowData => {
                return (
                  <DialogValidation validationLog={rowData}></DialogValidation>
                )
              }, sorting: false
            },
          ]}
          data={
            validationLogs
          }
          options={{
            search: true,
            sorting: true,
            headerStyle: { fontWeight: "700", fontSize: "0.9rem" },
          }}
          icons={tableIcons}
          components={{
            Container: props => <Paper {...props} elevation={0} />
          }}
        />}

    </React.Fragment>
  );
}
