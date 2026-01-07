const addy        = require('./utils/address');
const express 	  = require('express');

const app         = express()

// assign app settings from envvironment || defaults
const port    = process.env.PORT || 8080;
const name    = process.env.HEROKU_APP_NAME || 'Unknown Name';
const version = process.env.HEROKU_RELEASE_VERSION || 'Unknown Version';

const deposit_address_list = addy.getAddressList('neo');
const NEO_TX_URL = "https://chain.so/api/v2/get_tx_received/NEO/";
const update_url = process.env.API_UPDATE_URL;

// parse application/json (built into Express 4.16+)
app.use(express.json())

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', (req, res) => {
    res.json({ name, version });
});

//
// Retrieve last transaction sent to pre-sale/sale NEO address
//
app.post('/transaction/update', async (req, res) => {
  const promises = [];
  const errors = [];
  let count = 0;
  let total = 0;

  for (const address of deposit_address_list) {
    const url = NEO_TX_URL + address;
    console.log("Checking address " + url);

    promises.push(
      fetch(url)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const body = await response.json();
          //console.log("Transactions "+JSON.stringify(body.data.txs));

          for (const txn of body.data.txs) {
            const data = {
              wallet_address: "TBD",
              tx_id: txn.txid,
              tx_hash: txn.script_hex,
              amount: txn.value,
              currency: 'NEO'
            };
            count++;
            total += txn.value;

            try {
              const updateResponse = await fetch(update_url, {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              });

              if (updateResponse.ok) {
                console.log("Updated " + data.tx_id + " successfully for sending wallet " + txn.from);
              } else {
                console.log("Update of txn " + data.tx_id + " failed. status was " + updateResponse.status);
                errors.push("Error " + updateResponse.status + " while updating transaction");
              }
            } catch (error) {
              console.log("Error updating transaction:", error);
              errors.push("Error while updating: " + error.message);
            }
          }
        })
        .catch((err) => {
          errors.push(err.message || err);
        })
    );
  }

  try {
    await Promise.all(promises);
    if (errors && errors.length > 0) {
      res.status(500).json({ status: 500, error: errors });
    } else {
      res.json({ status: 200 });
    }
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
});

//
// Retrieve total transactions sent to NEO address
//
app.get('/transaction/total', async (req, res) => {
    try {
        const uri = "https://blockchain.info/balance/" + NEO_ADDR + "?format=json";
        const response = await fetch(uri);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const body = await response.json();
        const total = body.result;
        const ts = +new Date();
        res.json({ currency: "NEO", total: total, timestamp: ts });
    } catch (err) {
        console.error("Error fetching transaction total:", err);
        res.status(500).json({ error: err.message });
    }
});

// Start the app listening to default port
app.listen(port, () => {
   console.log(`${name} app is running on port ${port}`);
});
