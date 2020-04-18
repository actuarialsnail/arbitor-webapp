import React from 'react';
import { requestBalanceData, cancelBalanceListener } from '../api';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import TextField from '@material-ui/core/TextField';
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

const useStyles = makeStyles(theme => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
}));

export default function BalanceView() {
    const classes = useStyles();
    const [balanceData, setBalanceData] = React.useState('no balanceData yet');
    const [text, setText] = React.useState('');
    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
        requestBalanceData('', (data) => {
            //console.log(new Date(), data);
            setBalanceData(ffBalanceData(data));
            setLoaded(true);
        });
        return () => {
            cancelBalanceListener();
        }
    }, [])

    const ffBalanceData = (bData) => {
        //console.log(bData)
        let fData = [];
        let currencyList = [];
        Object.keys(bData).forEach(exchange => {
            let rowData = {};
            Object.keys(bData[exchange]).forEach(currency => {
                let balance = Number(bData[exchange][currency]);
                if (balance > 0) {
                    rowData[currency] = balance;
                    currencyList.push(currency);
                }
            })
            rowData.exchangeName = exchange;
            fData.push(rowData);
        })
        let uniqueCurrencyList = [...new Set(currencyList)];
        let ffData = []
        for (const exchangeData of fData) {
            for (const currency of uniqueCurrencyList) {
                if (!exchangeData.hasOwnProperty(currency)) {
                    exchangeData[currency] = 0;
                }
            }
            ffData.push(exchangeData);
        }
        return { ffData, uniqueCurrencyList };
    }

    const columnList = (list) => {
        let column = [{ title: 'Exchange', field: 'exchangeName' }];
        list.forEach(item => {
            column.push({ title: item, field: item });
        })
        return column;
    }

    const handleBalanceRequest = () => {
        setLoaded(false);
        requestBalanceData(text, (data) => {
            //console.log(new Date(), data);
            setBalanceData(ffBalanceData(data));
            setLoaded(true);
        });
    }

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    return (
        <div className={classes.root}>

            <TextField onChange={handleTextChange} />
            <Button variant="outlined" color="primary" onClick={handleBalanceRequest}>
                Request balance
            </Button>
            <div>
                {loaded && <MaterialTable
                    title="Balance"
                    columns={columnList(balanceData.uniqueCurrencyList)}
                    data={balanceData.ffData}
                    options={{
                        sorting: true,
                        search: true,
                    }}
                    icons={tableIcons}
                />}
            </div>
            <div>
                {
                    loaded && balanceData.uniqueCurrencyList.map(currency => {
                        //console.log(balanceData.ffData);
                        return (
                            <div key={currency}>
                                <Typography variant="h6">{currency}</Typography>
                                <BarChart width={400} height={200} data={balanceData.ffData} >
                                    <XAxis dataKey="exchangeName" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey={currency} fill="#8884d8" />
                                </BarChart>
                            </div>
                        )
                    })
                }
                {!loaded && <CircularProgress size={34} />}
            </div>
        </div>
    )
}