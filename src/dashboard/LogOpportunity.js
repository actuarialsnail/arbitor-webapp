import React from 'react';
import Title from './Title';
import { requestLogs, cancelLogsListener } from '../api';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import CircularProgress from '@material-ui/core/CircularProgress';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
require('highcharts/highcharts-more.js')(Highcharts);

export default function Opportunites() {
    const [loading, setLoading] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [HcOptions, setHcOptions] = React.useState(null);

    const handleDateChange = date => {
        setSelectedDate(date);
        setLoading(true);
        let requestDate = date.toJSON().slice(0, 10);
        processHcData(requestDate);
    };

    const updateHcOptions = (HcData) => {
        if (HcData === null) {
            setHcOptions(null);
            setLoading(false);
            return;
        }
        let options = {

            chart: {
                type: 'bubble',
                plotBorderWidth: 1,
                zoomType: 'xy'
            },

            legend: {
                enabled: false
            },

            exporting: {
                enabled: false
            },

            title: {
                text: 'Historical arbitrage opportunities'
            },

            subtitle: {
                text: ''
            },
            credits:{
                enabled: false,
            },
            xAxis: {
                gridLineWidth: 1,
                title: {
                    text: 'Time'
                },
                labels: {
                    formatter: function () {
                        let d = new Date(this.value);
                        return d.toTimeString().slice(0, 5);
                    }
                },
            },

            yAxis: {
                startOnTick: false,
                endOnTick: false,
                title: {
                    text: 'Profit'
                },
                labels: {
                    formatter: function () {
                        return this.value.toFixed(2) + ' %';
                    }
                },
                maxPadding: 0.2,
            },
            tooltip: {
                useHTML: true,
                formatter:
                    function () {
                        const d = new Date(this.point.x);
                        const n = new Date(this.point.z);
                        const heading = '<table><tr><th colspan="2"><h4>' + this.series.name + '</h4></th></tr>';
                        const time = '<tr><th>Time:</th><td>' + d.toTimeString().slice(0, 5) + '</td></tr>';
                        const profit = '<tr><th>Average Profit:</th><td>' + (this.point.y).toFixed(2) + '%</td></tr>';
                        const duration = '<tr><th>Duration:</th><td>' + n.toTimeString().slice(0, 5) + '</td></tr>';
                        const footer = '</table>'
                        return heading + time + profit + duration + footer;
                    },

                followPointer: true
            },
            series: HcData

        }
        setHcOptions(options);
        setLoading(false);
    };

    const processHcData = date => {
        // request data according to date
        // process the logs using callback

        requestLogs(date, 'hcData', (err, hcData) => {
            cancelLogsListener();
            //logs = tradeLog_dummy; // to remove post testing
            if (err) {
                console.log(err);
                updateHcOptions(null);
                return;
            }
            // console.log(hcData)
            let hcData_summary = []
            for (const route of hcData[0]) {
                let sData = route.data.reduce((a, b, index, self) => {
                    const keys = Object.keys(a);
                    let c = {};
                    keys.forEach((key) => {
                        c[key] = a[key] + b[key]
                        if (index + 1 === self.length && (key === 'x' || key === 'y')) {
                            c[key] = c[key] / self.length
                        }
                    })
                    return c;
                })
                if (sData.z === 0) { continue; }
                hcData_summary.push({
                    name: route.name,
                    data: [sData],
                })
            }
            // console.log(hcData_summary)
            updateHcOptions(hcData_summary);
        });

    }

    return (
        <React.Fragment>
            <Title>Historical opportunities</Title>
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
            {!loading &&
                HcOptions != null ? <HighchartsReact highcharts={Highcharts} options={HcOptions} /> : <div>{loading ? 'loaidng' : 'no files loaded'}</div>}
            {loading && <CircularProgress size={34} disableShrink />}
        </React.Fragment>
    )
}