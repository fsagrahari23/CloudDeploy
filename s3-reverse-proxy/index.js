const express = require('express');
const httpProxy = require('http-proxy');
const app = express();

const PORT = 8000;

app.use(express.json());

const proxy = httpProxy.createProxyServer({});

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, '../.env.common') });

// Load service-specific env second (it overrides shared vars if duplicate)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const bucketUrl = process.env.BUCKET_URL;

app.use((req, res) => {
    const hostname = req.hostname;
    console.log('Incoming request for hostname:', hostname);

    const subdomain = hostname.split('.')[0];
    // db QUERY FOR SUB DOMAIN AMD GET PROJECT ID OR NAME FROM prisma 


    // fetch project id or name from db and add that
    let path = req.url;

    // ✅ If request is root or folder, serve index.html
    if (path === '/' || path.endsWith('/')) {
        path += 'index.html';
    }
    // const id = get from prisma on the basis of  user id
    const target = `${bucketUrl}/${subdomain}`;
    console.log('Resolved S3 URL:', target);

    proxy.web(req, res, { target, changeOrigin: true }, (e) => {
        console.error('Proxy error:', e);
        res.status(502).send('Bad Gateway');
    });
});
proxy.on('proxyReq', (proxyReq, req, res, options) => {
    const url = req.url;
    if(url==='/'){
        proxyReq.path += 'index.html';
    }
});
app.listen(PORT, () => {
    console.log(`S3 Reverse Proxy Server is running on port ${PORT}`);
});
