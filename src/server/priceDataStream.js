const fetch = require('node-fetch');
const WebSocket = require('ws');

const config = {
  coinfloor: {
    wss: 'wss://api.coinfloor.co.uk/',
  },
  coinbase: {

  },
  kraken: {

  },
  scheduled_timer: 3600000 // hourly: 3600000 = 1000 *60 *60
}

class priceDataStreamClass {
  constructor() {
    this.priceData = {};
    this.routes = {};
  }

  masterStream() {
    this.coinfloorOrderbookRequest();
    this.coinbaseOrderbookRequest();
    this.binanceOrderbookRequest();
    this.krakenOrderbookRequest();
    this.cexOrderbookRequest();
  }

  coinfloorOrderbookRequest() {
    const request_WatchOrders = {
      tag: 1,
      method: "WatchOrders",
      base: 63488,
      counter: 64032,
      watch: true,
    }

    if ('BTCGBP' in this.priceData) {
      if (!('coinfloor' in this.priceData.BTCGBP)) {
        this.priceData.BTCGBP.coinfloor = {}
      }
    } else {
      this.priceData.BTCGBP = { 'coinfloor': {} }
    }
    let coinfloor_orderbook = {};

    const coinfloor_ws = new WebSocket('wss://api.coinfloor.co.uk/');
    coinfloor_ws.on('open', () => {
      console.log('coinfloor websocket connected at:', new Date());
      coinfloor_ws.send(JSON.stringify(request_WatchOrders));
      setTimeout(() => {
        console.log('scheduled reconnection of coinfloor websocket connection');
        coinfloor_ws.close();
      }, config.scheduled_timer);
    })

    coinfloor_ws.on('error', error => {
      console.log('coinfloor ws error:', error)
    })

    coinfloor_ws.on('message', msg_text => {
      // console.log('coinfloor ws message:', msg_text)
      let msg = JSON.parse(msg_text);
      let wsOrderbook = false;
      if (msg.orders) {
        wsOrderbook = true;
      } else if (msg.notice) {
        if (msg.notice == 'OrderOpened' || msg.notice == 'OrderClosed') { wsOrderbook = true; }
      }

      if (wsOrderbook) {
        this.priceData.BTCGBP.coinfloor = update_orders(msg);
        // console.log('bid 0', this.priceData.BTCGBP.coinfloor.bids[0], 'ask 0', this.priceData.BTCGBP.coinfloor.asks[0]);
        // console.log('bid 1', this.priceData.BTCGBP.coinfloor.bids[1], 'ask 1', this.priceData.BTCGBP.coinfloor.asks[1]);
        // console.log('bid 2', this.priceData.BTCGBP.coinfloor.bids[2], 'ask 2', this.priceData.BTCGBP.coinfloor.asks[2]);
        // console.log('bid 3', this.priceData.BTCGBP.coinfloor.bids[3], 'ask 3', this.priceData.BTCGBP.coinfloor.asks[3]);
      }

    })

    coinfloor_ws.on('close', () => {
      console.log('coinfloor websocket connection closed, reconnecting in 5s...');
      setTimeout(() => { this.coinfloorOrderbookRequest() }, 5000);
    })

    const update_orders = (data) => {

      if (data.orders) {
        //create order book
        data.orders.forEach((v, i) => {
          coinfloor_orderbook[v.id] = { price: v.price, quantity: v.quantity, time: v.time }
        })
        //console.log(orderbook);
      }
      if (data.notice) {
        if (data.notice === 'OrderOpened') {
          coinfloor_orderbook[data.id] = { price: data.price, quantity: data.quantity, time: data.time }
        }

        if (data.notice === 'OrderClosed') {
          delete coinfloor_orderbook[data.id];
        }
        // console.log('orderbook updated, size:', Object.keys(orderbook).length)
      }

      return formatOrderbook(coinfloor_orderbook);
    }

    const formatOrderbook = (raworderbook) => {
      let orderbook = Object.values(raworderbook).reduce((acc, obj) => {
        let key = obj.price;
        if (!acc[key]) { acc[key] = obj.quantity } else { acc[key] += obj.quantity }
        return acc;
      }, {})
      // console.log(Object.values(orderbook).length);

      let formattedOrderbook = { bids: [], asks: [] };
      Object.keys(orderbook).forEach(key => {
        let quantity = orderbook[key];
        if (quantity < 0) {
          formattedOrderbook.asks.push({ price: Number(key) / 100, size: -quantity / 10000 })
        }
        if (quantity > 0) {
          formattedOrderbook.bids.push({ price: Number(key) / 100, size: quantity / 10000 })
        }
      })
      // console.log(formattedOrderbook);
      formattedOrderbook.bids.sort((a, b) => { return b.price - a.price; });
      formattedOrderbook.asks.sort((a, b) => { return a.price - b.price; });
      return formattedOrderbook;
    }

  } // coinfloorOrderbookRequest

  krakenOrderbookRequest() {
    let kraken_orderbook = {};
    let kraken_depth = 10;
    const kraken_ws = new WebSocket('wss://ws.kraken.com');
    const kraken_map = (pair) => {
      return (pair.replace('/', '').replace('XBT', 'BTC'));
    }
    const kraken_pairs = ['BTC/GBP', 'ETH/GBP', 'BTC/EUR', 'ETH/EUR', 'BCH/EUR', 'LTC/EUR', 'ETH/BTC', 'BCH/BTC', 'LTC/BTC', 'BAT/BTC', 'BAT/ETH', 'BAT/EUR'];

    const kraken_request = {
      "event": "subscribe",
      "pair": kraken_pairs,
      "subscription": {
        "name": "book",
        "depth": kraken_depth,
      }
    }

    kraken_ws.on('open', () => {
      console.log('kraken websocket connected at:', new Date());
      kraken_ws.send(JSON.stringify(kraken_request));
      setTimeout(() => {
        console.log('scheduled reconnection of kraken websocket connection');
        kraken_ws.close();
      }, config.scheduled_timer);
    })

    kraken_ws.on('error', error => {
      console.log('kraken ws error:', error)
    })

    kraken_ws.on('message', msg_text => {
      let msg = JSON.parse(msg_text);
      // console.log('kraken ws message:', msg_text);

      try {
        if (Array.isArray(msg)) {
          let pair = kraken_map(msg[msg.length - 1]);
          if (pair in this.priceData) {
            if (!('kraken' in this.priceData[pair])) {
              this.priceData[pair].kraken = {}
            }
          } else {
            this.priceData[pair] = { 'kraken': {} }
          }
          kraken_orderbook[pair] = this.priceData[pair].kraken;

          if ("as" in msg[1]) { //snapshot // init set up orderbook format
            kraken_orderbook[pair].bids = [];
            msg[1].bs.forEach(order => { kraken_orderbook[pair].bids.push({ price: Number(order[0]), size: Number(order[1]) }) });
            kraken_orderbook[pair].asks = [];
            msg[1].as.forEach(order => { kraken_orderbook[pair].asks.push({ price: Number(order[0]), size: Number(order[1]) }) });
          } else
            if ("a" in msg[1] || "b" in msg[1]) { //feed updates
              for (let x of msg.slice(1, msg.length - 2)) { // possibility of both 'a' and 'b' updates in one feed
                if ('a' in x) {
                  updateOrderbook(pair, 'asks', x['a']);
                } else
                  if ('b' in x) {
                    updateOrderbook(pair, 'bids', x['b']);
                  }
              } //for both 'a' and 'b' updates in one feed
            } //if feed updates
          this.priceData[pair].kraken = processOrderbook(kraken_orderbook[pair]);
          // console.log(pair, 'orderbook:');
          // console.log('asks');
          // console.log(this.priceData[pair].kraken.asks.reverse());
          // console.log('bids');
          // console.log(this.priceData[pair].kraken.bids);
        } //if feed is array
      } catch (error) {
        console.log('kraken ws message not processed:', JSON.stringify(msg), 'error', error);
        exit();
      }
    })

    kraken_ws.on('close', () => {
      console.log('kraken websocket connection closed, reconnecting in 5s...');
      setTimeout(() => { this.krakenOrderbookRequest() }, 5000);
    })

    const updateOrderbook = (pair, side, order_updates) => {
      order_updates.forEach(order_update => {
        let count = 0;
        let updated = false;
        for (const order of kraken_orderbook[pair][side]) {
          if (order_update[0] == order.price) {
            kraken_orderbook[pair][side][count].price = Number(order_update[0]);
            kraken_orderbook[pair][side][count].size = Number(order_update[1]);
            updated = true;
            break;
          }
          count++;
        }
        if (!updated) { kraken_orderbook[pair][side].push({ price: Number(order_update[0]), size: Number(order_update[1]) }); }
      })
    }

    const processOrderbook = (orderbook) => {
      let processedOrderbook = {};
      Object.keys(orderbook).map(key => {
        // remove size 0 orders
        processedOrderbook[key] = orderbook[key].filter(order => order.size > 0)
        // sort asks and bids
        if (key == 'asks')
          processedOrderbook[key].sort((a, b) => { return a.price - b.price; });
        else {
          processedOrderbook[key].sort((a, b) => { return b.price - a.price; });
        }
      })
      return { asks: processedOrderbook.asks.splice(0, kraken_depth), bids: processedOrderbook.bids.splice(0, kraken_depth) };
    }

  } // krakenOrderbookRequest

  coinbaseOrderbookRequest() {
    const product_list = ['BTC-GBP', 'ETH-GBP', 'BCH-GBP', 'LTC-GBP', 'BTC-EUR', 'ETH-EUR', 'BCH-EUR', 'LTC-EUR', 'ETH-BTC', 'BCH-BTC', 'LTC-BTC', 'BAT-ETH', 'XRP-BTC', 'XRP-EUR'];
    // const product_list = ['BTC-GBP'];

    const coinbase = require('coinbase-pro');
    const coinbase_ws = new coinbase.WebsocketClient(
      product_list,
      'wss://ws-feed.pro.coinbase.com',
      "",
      { channels: ['level2'] }
    );

    let coinbase_orderbook = {};

    const coinbaseOrderbookInit = (baseArr) => {
      //init only require format object into numbers
      let updatedArr = []
      for (let item of baseArr) {
        updatedArr.push({ price: Number(item[0]), size: Number(item[1]) });
      }
      return updatedArr;
    }

    const coinbaseOrderbookUpdate = (baseArr, update) => {
      var found = false;
      var updatedArr = [];
      var updatePrice = Number(update[0]);
      var updateSize = Number(update[1]);
      var i = 0;
      var len = baseArr.length;
      while (i < len) {
        //if price matches then update the size, if size is 0 then ignore
        if (baseArr[i].price == updatePrice) {
          found = true;
          if (updateSize != 0) {
            updatedArr.push({ price: updatePrice, size: updateSize })
          }
        } else {
          updatedArr.push({ price: baseArr[i].price, size: baseArr[i].size })
        }
        i++
      }
      if (!found) { //if new item, add to array
        //console.log('not found', updatedArr);
        updatedArr.push({ price: updatePrice, size: updateSize });
      }
      return updatedArr;
    }

    const coinbaseSortedOrderbookSummary = (arr, bidask, len) => {
      arr.sort(function (a, b) {
        if (bidask == 'asks') { return a.price - b.price; }
        else { return b.price - a.price; }
      });
      return arr.slice(0, len);
    };

    coinbase_ws.on('open', function () {
      console.log('coinbase websocket connected at:', new Date());
      setTimeout(function () {
        console.log('scheduled reconnection of coinbase websocket connection');
        coinbase_ws.disconnect()
      }, config.scheduled_timer); //force restart websocke every hour - avoid ws freezing with no close event firing
    });

    coinbase_ws.on('message', data => {
      //console.log(data);
      let tickerDepth = 10;

      if (data['type'] == 'snapshot') {
        //initialise
        let product_id = data['product_id'].replace('-', '');
        if (product_id in this.priceData) {
          if (!('coinbase' in this.priceData[product_id])) {
            this.priceData[product_id].coinbase = {}
          }
        } else {
          this.priceData[product_id] = { 'coinbase': {} }
        }
        // this.priceData[product_id].coinbase = { bids: [], asks: [] };
        coinbase_orderbook[product_id] = { bids: [], asks: [] };

        coinbase_orderbook[product_id]['bids'] = coinbaseOrderbookInit(data['bids']);
        coinbase_orderbook[product_id]['asks'] = coinbaseOrderbookInit(data['asks']);
      }
      if (data['type'] == 'l2update') {
        let product_id = data['product_id'].replace('-', '');
        //console.log(data);
        data['changes'].forEach(update => {
          let updateType = update[0];
          let bidask = (updateType == 'buy') ? 'bids' : 'asks';
          coinbase_orderbook[product_id][bidask] = coinbaseOrderbookUpdate(coinbase_orderbook[product_id][bidask], [update[1], update[2]]);
          this.priceData[product_id].coinbase[bidask] = coinbaseSortedOrderbookSummary(coinbase_orderbook[product_id][bidask], bidask, tickerDepth);
        });
        // console.log(coinbase_orderbook['BTCGBP'].bids.length, coinbase_orderbook['BTCGBP'].asks.length);
        // console.log(this.priceData[product_id].coinbase.asks);
        // console.log(this.priceData[product_id].coinbase.bids);
      }
    });

    coinbase_ws.on('error', err => {
      /* handle error */
      console.log('Coinbase ws:', err);
    });

    coinbase_ws.on('close', () => {
      console.log('coinbase websocket connection closed, reconnecting in 5s...');
      setTimeout(() => { this.coinbaseOrderbookRequest() }, 5000);
    });
  } // coinbase pro

  binanceOrderbookRequest() {
    const product_list = ['ETHBTC', 'BCHBTC', 'LTCBTC', 'LTCETH', 'BATBTC', 'BATETH', 'XRPBTC'];
    const binance = require('binance-api-node').default;
    const binanceClient = binance();
    binanceClient.time().then(time => {
      let clean = binanceClient.ws.ticker(product_list, exchangeTicker)
      console.log('binance websocket connected at:', new Date());
      setTimeout(() => {
        console.log('scheduled reconnection of binance websocket connection');
        clean();
        console.log('binance websocket connection closed, reconnecting in 5s...');
        setTimeout(() => { this.binanceOrderbookRequest(); }, 5000)
      }, config.scheduled_timer);
    });

    let exchangeTicker = ticker => {
      let { symbol: symbol, bestBid: bestBid, bestBidQnt: bestBidQnt, bestAsk: bestAsk, bestAskQnt: bestAskQnt } = ticker;
      if (symbol in this.priceData) {
        if (!('binance' in this.priceData[symbol])) {
          this.priceData[symbol].binance = {}
        }
      } else {
        this.priceData[symbol] = { 'binance': {} }
      }
      this.priceData[symbol].binance = { bids: [{ price: Number(bestBid), size: Number(bestBidQnt) }], asks: [{ price: Number(bestAsk), size: Number(bestAskQnt) }] }
      // console.log(this.priceData[symbol].binance);
    }
  } // binanceOrderbookRequest

  cexOrderbookRequest() {
    const product_list = ['BTCGBP', 'ETHGBP', 'BCHGBP', 'LTCGBP', 'XRPGBP', 'BTCEUR', 'ETHEUR', 'BCHEUR', 'LTCEUR', 'XRPEUR', 'ETHBTC', 'BCHBTC', 'LTCBTC', 'XRPBTC', 'BATEUR'];
    let payload = product_list.map(product => {
      return 'pair-' + product.slice(0, 3) + '-' + product.slice(3, 6)
    })
    const pricescale = {
      BTC: 8,
      ETH: 6,
      BCH: 8,
      LTC: 8,
      XRP: 6,
      BAT: 6,
    }
    const cex_ws = new WebSocket('wss://ws.cex.io/ws');

    cex_ws.on('open', () => {
      // console.log('cex connection established')
      setTimeout(() => {
        console.log('scheduled reconnection of cex websocket connection');
        cex_ws.close();
      }, config.scheduled_timer);
    })

    cex_ws.on('error', error => {
      console.log('cex error', error);
    })

    // implement https://blog.cex.io/news/engine-updates-16956
    cex_ws.on('message', msg => {
      let data = JSON.parse(msg);
      if (data.e === 'md') {
        let pair = data.data.pair.replace(':', '');
        if (pair in this.priceData) {
          if (!('cex' in this.priceData[pair])) {
            this.priceData[pair].cex = {}
          }
        } else {
          this.priceData[pair] = { 'cex': {} }
        }
        this.priceData[pair].cex = { bids: formatOrderbook(data.data.buy), asks: formatOrderbook(data.data.sell) };
        //console.log(this.priceData[pair].cex.asks);
      }

      if (data.e === 'connected') {
        console.log('cex websocket connected at:', new Date());
        let request = {
          "e": "subscribe",
          "rooms": [...payload]
        };
        // console.log(request);
        cex_ws.send(JSON.stringify(request))
      }

      if (data.e === 'ping') {
        console.log('ping received');
        cex_ws.send('{"e":"pong"}');
      }
    });

    cex_ws.on('close', () => {
      console.log('cex websocket connection closed, reconnecting in 5s...');
      setTimeout(() => { this.cexOrderbookRequest() }, 5000);
    })

    const formatOrderbook = (data) => {
      let formattedData = data.map(order => {
        return { price: order[0], size: order[1] }
      })
      return formattedData
    }
  } //cexOrderbookRequest

}

module.exports = priceDataStreamClass;

// const stream = new priceDataStreamClass();
// stream.masterStream();
