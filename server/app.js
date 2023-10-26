const express = require("express");
const http = require("http");
const { rateLimit } = require("express-rate-limit");
const { initializeAPI } = require("./api");

// Create the express server
const app = express();
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  limit: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
// Apply the rate limiting middleware to all requests
app.use(limiter);
app.use(express.json());
const server = http.createServer(app);

// deliver static files from the client folder like css, js, images
app.use(express.static("client"));
// route for the homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

// Initialize the REST api
initializeAPI(app);

//start the web server
const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
  console.log(`Express Server started on port ${serverPort}`);
});

// Nach erfolgreichem Login:
fetch('/api/generate-keys')
    .then(response => response.json())
    .then(keys => {
        localStorage.setItem('publicKey', keys.publicKey);
        localStorage.setItem('privateKey', keys.privateKey);
    });

    // Nach erfolgreichem Login:
fetch('/api/generate-keys')
.then(response => response.json())
.then(keys => {
    localStorage.setItem('publicKey', keys.publicKey);
    localStorage.setItem('privateKey', keys.privateKey);
});

const JSEncrypt = require('jsencrypt').JSEncrypt;
const encrypt = new JSEncrypt();
encrypt.setPublicKey(localStorage.getItem('publicKey'));

const encryptedContent = encrypt.encrypt("Ihr Postinhalt hier");

const decrypt = new JSEncrypt();
decrypt.setPrivateKey(localStorage.getItem('privateKey'));

const decryptedContent = decrypt.decrypt(encryptedServerContent);
