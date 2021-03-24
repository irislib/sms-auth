const IRIS_PRIVATE_KEY = JSON.parse(process.env.IRIS_PRIVATE_KEY || 'null');
const PEERS = process.env.PEERS && process.env.PEERS.split(',');
const PORT = process.env.PORT || 3000;

// process.env.GOOGLE_APPLICATION_CREDENTIALS should be the file path of a JSON containing the service account key

const admin = require('firebase-admin');
var firebaseApp = admin.initializeApp({
  databaseURL: "https://iris-99003.firebaseio.com",
  projectId: "iris-99003"
});

const Gun = require('gun');
const SEA = require('gun/sea');

const express = require('express');
const app = express();
const publicState = new Gun({peers:PEERS});
const user = publicState.user();
user.auth(IRIS_PRIVATE_KEY);

app.get('/auth', async (req, res) => {
  if (!(IRIS_PRIVATE_KEY && PEERS)) {
    return res.status(400).send({message: 'bad server config'});
  }
  const idToken = req.query.token;
  const pub = req.query.pub;
  if (idToken && pub) {
    admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      user.get('uidToPub').get(uid).put(pub);
      user.get('follow').get(pub).put(true);
      console.log('linked user', pub.slice(0,6), '... to uid', uid.slice(0,6), '...');
      res.send('');
    })
    .catch((error) => {
      res.status(400).send({message: 'infernal server error'});
      console.error('firebase authentication failure: ', error);
    });
  }
});

app.use(express.static('public'));

app.listen(INCOMING_HTTP_PORT);
