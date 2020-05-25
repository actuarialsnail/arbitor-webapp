const WebSocket = require('ws');
const fetch = require('node-fetch');

const _config = {
  scheduled_timer: 3600000 // hourly: 3600000 = 1000 *60 *60, 2 minutes: 120000
}

class priceDataStreamClass {
  constructor() {
    this.streamData = {};
    this.priceData = {};
    this.accSizeData = {};
    this.exchangeData = {};
  }

  apiRequest(url, method, headers, body, cb) {
    try {
      fetch(url, {
        method: method,
        headers: headers,
        body: body
      })
        .then(response => {
          if (response.status !== 200) {
            console.log(new Date(), 'Error occured. Status Code: ' + response.status);
            response.json().then(data => { console.log(new Date(), data) });
            return;
          }
          return response.json()
        })
        .then(data => {
          //console.log(data);
          cb(data)
        })
        .catch(error => {
          console.error(new Date(), error);
        })
      // console.log(response);
      // const json = JSON.parse(response);
      // //console.log(json)
      // return json;
    } catch (error) {
      console.log('apiRequest error:', error, url);
      return (error);
    }
  }

  updateProductProps(balanceData, exchangeData) {
    this.accSizeData = balanceData;
    this.exchangeData = exchangeData;
  }

  masterStream() {
    this.coinfloorOrderbookRequest();
    this.coinbaseOrderbookRequest();
    this.binanceOrderbookRequest();
    this.krakenOrderbookRequest();
    this.cexOrderbookRequest();
    setInterval(() => {
      this.bisqOrderbookRequst();
    }, 1000)
  }

  coinfloorOrderbookRequest() {
    let coinfloorTimeout;
    const tickerDepth = 10;
    const request_WatchOrders = {
      tag: 1,
      method: "WatchOrders",
      base: 63488,
      counter: 64032,
      watch: true,
    }

    if ('BTC-GBP' in this.streamData) {
      if (!('coinfloor' in this.streamData['BTC-GBP'])) {
        this.streamData['BTC-GBP'].coinfloor = {}
      }
    } else {
      this.streamData['BTC-GBP'] = { 'coinfloor': {} }
    }
    let coinfloor_orderbook = {};

    const coinfloor_ws = new WebSocket('wss://api.coinfloor.co.uk/');
    coinfloor_ws.on('open', () => {
      console.log('coinfloor websocket connected at:', new Date());
      coinfloor_ws.send(JSON.stringify(request_WatchOrders));
      coinfloorTimeout = setTimeout(() => {
        console.log('scheduled reconnection of coinfloor websocket connection');
        coinfloor_ws.close();
      }, _config.scheduled_timer);
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
        this.streamData['BTC-GBP'].coinfloor = { ...update_orders(msg), timestamp: Date.now() };
        // console.log('bid 0', this.streamData['BTC-GBP'].coinfloor.bids[0], 'ask 0', this.streamData['BTC-GBP'].coinfloor.asks[0]);
        // console.log('bid 1', this.streamData['BTC-GBP'].coinfloor.bids[1], 'ask 1', this.streamData['BTC-GBP'].coinfloor.asks[1]);
        // console.log('bid 2', this.streamData['BTC-GBP'].coinfloor.bids[2], 'ask 2', this.streamData['BTC-GBP'].coinfloor.asks[2]);
        // console.log('bid 3', this.streamData['BTC-GBP'].coinfloor.bids[3], 'ask 3', this.streamData['BTC-GBP'].coinfloor.asks[3]);
        this.streamDataToPriceData('BTC-GBP', 'coinfloor', this.streamData['BTC-GBP'].coinfloor);
      }

    })

    coinfloor_ws.on('close', () => {
      console.log('coinfloor websocket connection closed, reconnecting in 5s...');
      clearTimeout(coinfloorTimeout);
      setTimeout(() => { this.coinfloorOrderbookRequest() }, 5000);
    })

    const update_orders = (data) => {

      if (data.orders) {
        //create order book
        data.orders.forEach((v) => {
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
      formattedOrderbook.bids.sort((a, b) => { return b.price - a.price; }).splice(tickerDepth);
      formattedOrderbook.asks.sort((a, b) => { return a.price - b.price; }).splice(tickerDepth);
      return formattedOrderbook;
    }

  } // coinfloorOrderbookRequest

  krakenOrderbookRequest() {
    let krakenTimeout;
    let kraken_orderbook = {};
    let kraken_depth = 10;
    const kraken_ws = new WebSocket('wss://ws.kraken.com');
    const kraken_map = (pair) => {
      return (pair.replace('/', '-').replace('XBT', 'BTC'));
    }
    const kraken_pairs = ['BTC/GBP', 'ETH/GBP', 'BTC/EUR', 'ETH/EUR', 'BCH/EUR', 'LTC/EUR', 'ETH/BTC', 'BCH/BTC', 'LTC/BTC', 'BAT/BTC', 'BAT/ETH', 'BAT/EUR', 'GBP/USD', 'EUR/USD', 'EUR/GBP'];

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
      krakenTimeout = setTimeout(() => {
        console.log('scheduled reconnection of kraken websocket connection');
        kraken_ws.close();
      }, _config.scheduled_timer);
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
          if (pair in this.streamData) {
            if (!('kraken' in this.streamData[pair])) {
              this.streamData[pair].kraken = {}
            }
          } else {
            this.streamData[pair] = { 'kraken': {} }
          }
          kraken_orderbook[pair] = this.streamData[pair].kraken;

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
          this.streamData[pair].kraken = { ...processOrderbook(kraken_orderbook[pair]), timestamp: Date.now() };
          // console.log(pair, 'orderbook:');
          // console.log('asks');
          // console.log(this.streamData[pair].kraken.asks.reverse());
          // console.log('bids');
          // console.log(this.streamData[pair].kraken.bids);
          this.streamDataToPriceData(pair, 'kraken', this.streamData[pair].kraken);
        } //if feed is array
      } catch (error) {
        console.log('kraken ws message not processed:', JSON.stringify(msg), 'error', error);
        exit();
      }
    })

    kraken_ws.on('close', () => {
      console.log('kraken websocket connection closed, reconnecting in 5s...');
      clearTimeout(krakenTimeout);
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
        // sort asks and bids
        if (key == 'asks') {
          // remove size 0 orders
          processedOrderbook[key] = orderbook[key].filter(order => order.size > 0);
          processedOrderbook[key].sort((a, b) => { return a.price - b.price; });
        }
        else if (key == 'bids') {
          // remove size 0 orders
          processedOrderbook[key] = orderbook[key].filter(order => order.size > 0);
          processedOrderbook[key].sort((a, b) => { return b.price - a.price; });
        }
      })
      return { asks: processedOrderbook.asks.splice(0, kraken_depth), bids: processedOrderbook.bids.splice(0, kraken_depth) };
    }

  } // krakenOrderbookRequest

  coinbaseOrderbookRequest() {
    let coinbaseTimeout;
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
      coinbaseTimeout = setTimeout(function () {
        console.log('scheduled reconnection of coinbase websocket connection');
        try { coinbase_ws.disconnect() } catch (err) { console.log(err) };
      }, _config.scheduled_timer); //force restart websocke every hour - avoid ws freezing with no close event firing
    });

    coinbase_ws.on('message', data => {
      //console.log(data);
      let tickerDepth = 10;
      if (data['type'] == 'snapshot') {
        //initialise
        let product_id = data['product_id'];
        if (product_id in this.streamData) {
          if (!('coinbase' in this.streamData[product_id])) {
            this.streamData[product_id].coinbase = {}
          }
        } else {
          this.streamData[product_id] = { 'coinbase': {} }
        }
        // this.streamData[product_id].coinbase = { bids: [], asks: [] };
        coinbase_orderbook[product_id] = { bids: [], asks: [] };

        coinbase_orderbook[product_id]['bids'] = coinbaseOrderbookInit(data['bids']);
        coinbase_orderbook[product_id]['asks'] = coinbaseOrderbookInit(data['asks']);
        this.streamData[product_id].coinbase['bids'] = coinbaseSortedOrderbookSummary(coinbase_orderbook[product_id]['bids'], 'bids', tickerDepth);
        this.streamData[product_id].coinbase['asks'] = coinbaseSortedOrderbookSummary(coinbase_orderbook[product_id]['asks'], 'asks', tickerDepth);
        this.streamData[product_id].coinbase['timestamp'] = Date.now();
      }
      if (data['type'] == 'l2update') {
        let product_id = data['product_id'];
        //console.log(data);
        data['changes'].forEach(update => {
          let updateType = update[0];
          let bidask = (updateType == 'buy') ? 'bids' : 'asks';
          coinbase_orderbook[product_id][bidask] = coinbaseOrderbookUpdate(coinbase_orderbook[product_id][bidask], [update[1], update[2]]);
          this.streamData[product_id].coinbase[bidask] = coinbaseSortedOrderbookSummary(coinbase_orderbook[product_id][bidask], bidask, tickerDepth);
        });
        // console.log(coinbase_orderbook['BTC-GBP'].bids.length, coinbase_orderbook['BTC-GBP'].asks.length);
        // console.log(this.streamData[product_id].coinbase.asks);
        // console.log(this.streamData[product_id].coinbase.bids);
        this.streamData[product_id].coinbase['timestamp'] = Date.now();
        this.streamDataToPriceData(product_id, 'coinbase', this.streamData[product_id].coinbase);
      }
    });

    coinbase_ws.on('error', err => {
      /* handle error */
      console.log('Coinbase ws:', err);
    });

    coinbase_ws.on('close', () => {
      console.log('coinbase websocket connection closed, reconnecting in 5s...');
      clearTimeout(coinbaseTimeout);
      setTimeout(() => { this.coinbaseOrderbookRequest() }, 5000);
    });
  } // coinbase pro

  binanceOrderbookRequest() {
    let binanceTimeout;
    const product_list = ['ETHBTC', 'BCHBTC', 'LTCBTC', 'LTCETH', 'BATBTC', 'BATETH', 'XRPBTC', 'BTCEUR', 'ETHEUR', 'XRPEUR'];
    const binanceMap = {};
    product_list.forEach(key => {
      binanceMap[key] = key.slice(0, 3) + '-' + key.slice(3, 6);
    })
    // const binance = require('binance-api-node').default;
    // const binanceClient = binance();
    // binanceClient.time().then(() => {
    //   let clean = binanceClient.ws.ticker(product_list, exchangeTicker)
    //   console.log('binance websocket connected at:', new Date());
    //   binanceTimeout = setTimeout(() => {
    //     console.log('scheduled reconnection of binance websocket connection');
    //     clean();
    //     console.log('binance websocket connection closed, reconnecting in 5s...');
    //     clearTimeout(binanceTimeout);
    //     setTimeout(() => { this.binanceOrderbookRequest(); }, 5000)
    //   }, _config.scheduled_timer);
    // });
    const binance_ws = new WebSocket('wss://stream.binance.com:9443/ws');

    binance_ws.on('open', () => {
      console.log('binance websocket connected at:', new Date());
      binanceTimeout = setTimeout(() => {
        console.log('scheduled reconnection of binance websocket connection');
        binance_ws.close();
      }, _config.scheduled_timer);
      const req = {
        "method": "SUBSCRIBE",
        "params": product_list.map(product => product.toLowerCase() + '@bookTicker'),
        "id": 1
      }
      binance_ws.send(JSON.stringify(req));

    });

    binance_ws.on('error', error => {
      console.log('binance error', error);
    })

    binance_ws.on('ping', (msg) => {
      // console.log('ping received...', msg);
      binance_ws.pong();
    })

    binance_ws.on('message', msg => {
      // console.log(msg);
      let res;
      try {
        res = JSON.parse(msg);
      } catch (e) {
        console.log('json error', e)
      }

      if (res.id === 1) { return; }

      exchangeTicker(res);
    })

    binance_ws.on('close', () => {
      console.log('binance websocket connection closed, reconnecting in 5s...');
      clearTimeout(binanceTimeout);
      setTimeout(() => { this.binanceOrderbookRequest() }, 5000);
    })

    let exchangeTicker = ticker => {
      let { s: bsymbol, b: bestBid, B: bestBidQnt, a: bestAsk, A: bestAskQnt } = ticker;
      let symbol = binanceMap[bsymbol];
      if (symbol in this.streamData) {
        if (!('binance' in this.streamData[symbol])) {
          this.streamData[symbol].binance = {}
        }
      } else {
        this.streamData[symbol] = { 'binance': {} }
      }
      this.streamData[symbol].binance = { bids: [{ price: Number(bestBid), size: Number(bestBidQnt) }], asks: [{ price: Number(bestAsk), size: Number(bestAskQnt) }], timestamp: Date.now() }
      // console.log(this.streamData[symbol].binance);
      this.streamDataToPriceData(symbol, 'binance', this.streamData[symbol].binance);
    }
  } // binanceOrderbookRequest

  cexOrderbookRequest() {
    const product_list = ['BTC-GBP', 'ETH-GBP', 'BCH-GBP', 'LTC-GBP', 'XRP-GBP', 'BTC-EUR', 'ETH-EUR', 'BCH-EUR', 'LTC-EUR', 'XRP-EUR', 'ETH-BTC', 'BCH-BTC', 'LTC-BTC', 'XRP-BTC', 'BAT-EUR'];
    let cexTimeout;
    let payload = product_list.map(product => {
      return 'pair-' + product
    })
    const cex_ws = new WebSocket('wss://ws.cex.io/ws');

    cex_ws.on('open', () => {
      // console.log('cex connection established')
      cexTimeout = setTimeout(() => {
        console.log('scheduled reconnection of cex websocket connection');
        cex_ws.close();
      }, _config.scheduled_timer);
    })

    cex_ws.on('error', error => {
      console.log('cex error', error);
    })

    // implement https://blog.cex.io/news/engine-updates-16956
    cex_ws.on('message', msg => {
      let data = JSON.parse(msg);
      if (data.e === 'md') {
        let pair = data.data.pair.replace(':', '-');
        if (pair in this.streamData) {
          if (!('cex' in this.streamData[pair])) {
            this.streamData[pair].cex = {}
          }
        } else {
          this.streamData[pair] = { 'cex': {} }
        }
        this.streamData[pair].cex = { bids: formatOrderbook(data.data.buy), asks: formatOrderbook(data.data.sell), timestamp: Date.now() };
        //console.log(this.streamData[pair].cex.asks);
        this.streamDataToPriceData(pair, 'cex', this.streamData[pair].cex);
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
      clearTimeout(cexTimeout);
      setTimeout(() => { this.cexOrderbookRequest() }, 5000);
    })

    const formatOrderbook = (data) => {
      let formattedData = data.map(order => {
        return { price: order[0], size: order[1] }
      })
      return formattedData
    }
  } //cexOrderbookRequest

  bisqOrderbookRequst() {
    const exchange = 'bisq';
    const product_list = ['ETH-BTC', 'LTC-BTC', 'BTC-GBP', 'BTC-EUR'];
    const bisqFormat = (product) => {
      return product.replace('-', '_').toLowerCase();
    }
    const bisq_url = 'https://markets.bisq.network/api/offers?market=';
    product_list.forEach(product => {
      if (product in this.streamData) {
        if (!('bisq' in this.streamData[product])) {
          this.streamData[product].bisq = {}
        }
      } else {
        this.streamData[product] = { 'bisq': {} }
      }
      const bisq_product = bisqFormat(product);
      const endpoint = bisq_url + bisq_product;
      this.apiRequest(endpoint, 'GET', null, null, data => {
        // console.log(data[bisq_product]);
        let bids = []; let asks = [];
        for (const order of data[bisq_product].buys) {
          bids.push({ price: Number(order.price), size: Number(order.amount) })
        }
        for (const order of data[bisq_product].sells) {
          asks.push({ price: Number(order.price), size: Number(order.amount) })
        }
        this.streamData[product][exchange] = { asks, bids, timestamp: Date.now() }
        this.streamDataToPriceData(product, exchange, this.streamData[product].bisq);
      })
    });

    const sortOrderbook = (ordersArr) => {

    }
  }

  streamDataToPriceData(pair, exchange, pairData) {
    const [s1, s2] = pair.split('-');
    const bestBid = pairData.bids[0];
    const bestAsk = pairData.asks[0];
    const key1 = s1 + '-' + s2 + '-' + exchange;
    const key2 = s2 + '-' + s1 + '-' + exchange;
    const price1 = bestBid.price;
    const price2 = 1 / bestAsk.price;
    const mktSize1 = bestBid.size;
    const mktSize2 = bestAsk.size / price2;
    const accSize1 = this.accSizeData[exchange][s1] || 0;
    const accSize2 = this.accSizeData[exchange][s2] || 0;
    const tradeFee1 = this.exchangeData[exchange].tradeFee;
    const tradeFee2 = this.exchangeData[exchange].tradeFee;
    // const depositFee1 = { add: 0, pc: 0 };
    // const depositFee2 = { add: 0, pc: 0 };
    // const withdrawalFee1 = { add: 0, pc: 0 };
    // const withdrawalFee2 = { add: 0, pc: 0 };
    const timestamp = pairData.timestamp;
    // this.priceData[key1] = { price: price1, mktSize: mktSize1, accSize: accSize1, tradeFee: tradeFee1, depositFee: depositFee1, withdrawalFee: withdrawalFee1, timestamp: timestamp, tradeSide: "sell", tradeKey: key1 };
    // this.priceData[key2] = { price: price2, mktSize: mktSize2, accSize: accSize2, tradeFee: tradeFee2, depositFee: depositFee2, withdrawalFee: withdrawalFee2, timestamp: timestamp, tradeSide: "buy", tradeKey: key1 };
    this.priceData[key1] = { price: price1, mktSize: mktSize1, accSize: accSize1, tradeFee: tradeFee1, timestamp: timestamp, tradeSide: "sell", tradeKey: key1 };
    this.priceData[key2] = { price: price2, mktSize: mktSize2, accSize: accSize2, tradeFee: tradeFee2, timestamp: timestamp, tradeSide: "buy", tradeKey: key1 };
  }

}

module.exports = priceDataStreamClass;

// const stream = new priceDataStreamClass();
// stream.masterStream();
