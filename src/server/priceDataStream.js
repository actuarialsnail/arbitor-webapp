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
}

class priceDataStreamClass {
  constructor() {
    this.priceData = {};
    this.routes = {};
  }

  masterStream() {
    //this.coinfloorOrderbookRequest();
    // this.coinbaseOrderbookRequest();
    // this.binanceOrderbookRequest();
    this.krakenOrderbookRequest();
    // this.cexOrderbookRequest();
  }

  coinfloorOrderbookRequest() {
    const request_WatchOrders = {
      tag: 1,
      method: "WatchOrders",
      base: 63488,
      counter: 64032,
      watch: true,
    }

    this.priceData.coinfloor = {};
    let orderbook = {};

    const coinfloor_ws = new WebSocket('wss://api.coinfloor.co.uk/');
    coinfloor_ws.on('open', () => {
      console.log('coinfloor ws connected');
      coinfloor_ws.send(JSON.stringify(request_WatchOrders));
    })

    coinfloor_ws.on('error', error => {
      console.log('coinfloor ws error:', error)
    })

    coinfloor_ws.on('message', msg_text => {
      console.log('coinfloor ws message:', msg_text)
      let msg = JSON.parse(msg_text);

      this.priceData.coinfloor.BTCGBP = update_orders(msg);

      console.log('bid 0', this.priceData.coinfloor.BTCGBP.bids[0], 'ask 0', this.priceData.coinfloor.BTCGBP.asks[0]);
      console.log('bid 1', this.priceData.coinfloor.BTCGBP.bids[1], 'ask 1', this.priceData.coinfloor.BTCGBP.asks[1]);
      console.log('bid 2', this.priceData.coinfloor.BTCGBP.bids[2], 'ask 2', this.priceData.coinfloor.BTCGBP.asks[2]);
      console.log('bid 3', this.priceData.coinfloor.BTCGBP.bids[3], 'ask 3', this.priceData.coinfloor.BTCGBP.asks[3]);
    })

    coinfloor_ws.on('close', () => {
      console.log('coinfloor ws disconnected')
    })

    const update_orders = (data) => {

      if (data.orders) {
        //create order book
        data.orders.forEach((v, i) => {
          orderbook[v.id] = { price: v.price, quantity: v.quantity }
        })
        //console.log(orderbook);
      }
      if (data.notice) {
        if (data.notice === 'OrderOpened') {
          orderbook[data.id] = { price: data.price, quantity: data.quantity, time: data.time }
        }

        if (data.notice === 'OrderClosed') {
          delete orderbook[data.id];
        }
        console.log('orderbook updated, size:', Object.keys(orderbook).length)
      }

      return formatOrderbook(orderbook);
    }

    const formatOrderbook = (raworderbook) => {
      let orderbook = Object.values(raworderbook).reduce((acc, obj) => {
        let key = obj.price;
        if (!acc[key]) { acc[key] = obj.quantity } else { acc[key] += obj.quantity }
        return acc;
      }, {})
      console.log(Object.values(orderbook).length);

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
    this.priceData.kraken = {};
    let kraken_orderbook = {};
    let kraken_depth = 10;
    const kraken_ws = new WebSocket('wss://ws.kraken.com');
    const kraken_map = {

    }

    const kraken_request = {
      "event": "subscribe",
      "pair": [
        "XBT/USD",
        "BTC/EUR",
        "BTC/GBP",
      ],
      "subscription": {
        "name": "book",
        "depth": kraken_depth,
      }
    }

    kraken_ws.on('open', () => {
      console.log('kraken ws connected')
      kraken_ws.send(JSON.stringify(kraken_request));
    })

    kraken_ws.on('error', error => {
      console.log('kraken ws error:', error)
    })

    kraken_ws.on('message', msg_text => {
      let msg = JSON.parse(msg_text);
      // console.log('kraken ws message:', msg_text);

      //const a = [0, { "a": [["8880.50000", "0.06552590", "1582836045.595097"]] }, { "b": [["8880.50000", "0.00000000", "1582836045.596932"], ["8870.50000", "0.64000000", "1582836045.410447", "r"]] }, "book-10", "XBT/USD"]
      try {
        if (Array.isArray(msg)) {
          let pair = msg[msg.length - 1];
          pair in this.priceData.kraken ? null : this.priceData.kraken[pair] = {};
          kraken_orderbook[pair] = this.priceData.kraken[pair];

          if ("as" in msg[1]) { //snapshot // init set up orderbook format
            kraken_orderbook[pair].asks = [];
            msg[1].as.forEach(order => { kraken_orderbook[pair].asks.push({ price: order[0], size: order[1] }) });
            kraken_orderbook[pair].bids = [];
            msg[1].bs.forEach(order => { kraken_orderbook[pair].bids.push({ price: order[0], size: order[1] }) });
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
          this.priceData.kraken[pair] = processOrderbook(kraken_orderbook[pair]);
          // console.log(pair, 'orderbook:');
          // console.log('asks');
          // console.log(this.priceData.kraken[pair].asks.reverse());
          // console.log('bids');
          // console.log(this.priceData.kraken[pair].bids);
        } //if feed is array
      } catch (error) {
        console.log('kraken ws message not processed:', JSON.stringify(msg), 'error', error);
        exit();
      }
    })

    kraken_ws.on('close', () => {
      console.log('kraken ws disconnected')
    })

    const updateOrderbook = (pair, side, order_updates) => {
      order_updates.forEach(order_update => {
        let count = 0;
        let updated = false;
        for (const order of kraken_orderbook[pair][side]) {
          if (order_update[0] == order.price) {
            kraken_orderbook[pair][side][count].price = order_update[0];
            kraken_orderbook[pair][side][count].size = order_update[1];
            updated = true;
            break;
          }
          count++;
        }
        if (!updated) { kraken_orderbook[pair][side].push({ price: order_update[0], size: order_update[1] }); }
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


}

const stream = new priceDataStreamClass();
stream.masterStream();
