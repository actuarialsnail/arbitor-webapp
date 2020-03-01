const io = require('socket.io')();
const fs = require('fs');
const readline = require('readline');

const priceDataStream = require('./priceDataStream');
const priceStream = new priceDataStream();
priceStream.masterStream();

io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      client.emit('timer', new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    }, interval);
  });

  client.on('requestTradeLogs', (date) => {
    console.log('client is requesting data for:', date);
    let tradeLogs = [];
    let path = '../../../arbitorLog/tradeLog' + date + '.json';

    try {
      if (fs.existsSync(path)) {
        //file exists
        const readInterface = readline.createInterface({
          input: fs.createReadStream('../../../arbitorLog/tradeLog' + date + '.json'),
          //output: process.stdout,
          console: false
        });

        readInterface.on('line', (line) => {
          tradeLogs.push(JSON.parse(line))
        });

        readInterface.on('close', () => {
          //console.log(tradeLogs);
          client.emit('tradeLogs', { data: tradeLogs, error: false });
        })

      } else {
        console.log('no files found')
        client.emit('tradeLogs', { data: {}, error: 'no files found' });
      }
    } catch (err) {
      console.error(err)
      client.emit('tradeLogs', { data: {}, error: err });
    }
  });

  client.on('requestPriceData', (interval) => {
    console.log('client is subscribing to price data stream with interval ', interval);
    setInterval(() => {
      client.emit('priceData', priceStream.priceData);
    }, interval);
  })
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);