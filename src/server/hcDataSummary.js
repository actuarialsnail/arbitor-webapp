const process = require('process');
let fs = require('fs'), readline = require('readline');
const waitperiod = 30 * 1000; // n * 1000ms

const processLineByLine = async (directoryPath, filename) => {
    // async function processLineByLine(directoryPath, filename) {
    let sub_hcd_data = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(directoryPath + '/' + filename)
    });
    let count = 0;
    for await (const ln of rl) {
        try {
            //console.log(ln);
            const line = JSON.parse(ln);
            const timestamp = line.timestamp.slice(-1)[0];
            const price = (line.price.slice(-1)[0] - 1) * 100;
            if (sub_hcd_data.length === 0) {
                sub_hcd_data.push({
                    x: timestamp,
                    y: price,
                    z: 0,
                    // to include other stats like min, max price, min, max liquidity, average liquidity
                })
            }
            const lastCluster = sub_hcd_data.length - 1;
            const prevTimestamp = sub_hcd_data[lastCluster].x;
            const prevDuration = sub_hcd_data[lastCluster].z;
            if ((timestamp - prevTimestamp - prevDuration) < waitperiod) {
                sub_hcd_data[lastCluster].y = (sub_hcd_data[lastCluster].y * count + price) / (count + 1)
                sub_hcd_data[lastCluster].z = timestamp - prevTimestamp;
                count++;
            } else {
                sub_hcd_data.push({
                    x: timestamp,
                    y: price,
                    z: 0,
                })
                count = 0
            }
        } catch (err) {
            console.log(err);
        }
    }
    console.log(filename + ' processed');
    return sub_hcd_data;
}

const summarise = async (directoryPath, date) => {
    console.time('opp data process');
    const filesInScope = fs.readdirSync(directoryPath + '/' + date);
    let hcData = [];
    for (const filename of filesInScope) {
        let sub_hcd = { name: filename.replace(date + '-', '').replace('.json', '') };
        const readfile = async () => { return await processLineByLine(directoryPath + '/' + date, filename); }
        // sub_hcd.data = processLineByLine(directoryPath, filename);
        sub_hcd.data = await readfile();
        hcData.push(sub_hcd);
    };
    console.log(hcData.length + ' routes processed');
    fs.writeFileSync('./hcd/' + date + '.json', JSON.stringify(hcData), (err) => {
        if (err) { console.log('Error occured when writing to hcd', { timestamp: Date.now(), err }); }
    })
    console.timeEnd('opp data process');
    generateHtml(hcData, date);
}

const generateHtml = (hcData, date) => {
    hcData_summary = htmlData_summary(hcData);
    fs.writeFileSync('./hcd/' + date + '_summary.json', JSON.stringify(hcData_summary), (err) => {
        if (err) { console.log('Error occured when writing to hcd_summary', { timestamp: Date.now(), err }); }
    })
    fs.readFile('./template.html', 'utf8', (err, data) => {
        if (err) {
            return console.log(err);
        }
        let result = data.replace("['{{placeholder}}']", JSON.stringify(hcData_summary)).replace("{{date}}", date);
        fs.writeFile('./hcd/' + date + '.html', result, 'utf8', (err) => {
            if (err) return console.log(err);
        });
    });

}

const htmlData_summary = (hcData) => {
    let hcData_summary = [];
    for (const route of hcData) {
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
    return hcData_summary
}

module.exports = { summarise };

const mode = process.argv[2] || false;

if (mode == "standalone") {
    if (process.pid) {
        console.log('Process started with pid: ' + process.pid);
    }
    const dirpath = './log/opportunity'
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    let prefix_date = yesterday.toJSON().slice(0, 10);
    // console.log(prefix_date);
    // prefix_date = '2020-06-05';
    summarise(dirpath, prefix_date);
}