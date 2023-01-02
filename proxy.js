var express = require('express');
var request = require('request');
var cors = require('cors');
const path = require('path');
require('dotenv').config();
var proxy = express();

let proxyDestination = process.env.PROXY_DESTINATION;
const credentials = process.env.PROXY_CREDENTIALS || false;
const origin = process.env.PROXY_ORIGIN || '*';
const port = process.env.PORT || 8222;
const proxyPartial = process.env.PROXY_PATH || 'proxy';

proxy.use(express.static('public'));

const nm_dependencies = ['bootstrap'];
nm_dependencies.forEach(dep => {
  proxy.use(`/${dep}`, express.static(path.resolve(`node_modules/${dep}`)));
});

proxy.use(cors({ credentials: credentials, origin: origin }));
proxy.options('*', cors({ credentials: credentials, origin: origin }));

// remove trailing slash
var cleanproxyDestination = proxyDestination.replace(/\/$/, '');
// remove all forward slashes
var cleanProxyPartial = proxyPartial.replace(/\//g, '');

proxy.use('/' + cleanProxyPartial, function (req, res) {
  try {
    console.log('Requested URL -> ', cleanproxyDestination + req.url + ' (' + req.method + ')');
  } catch (e) { }
  req.pipe(
    request(cleanproxyDestination + req.url)
      .on('response', response => {
        // In order to avoid https://github.com/expressjs/cors/issues/134
        const accessControlAllowOriginHeader = response.headers['access-control-allow-origin']
        if (accessControlAllowOriginHeader && accessControlAllowOriginHeader !== origin) {
          console.log('Override access-control-allow-origin header from proxified URL : ' + accessControlAllowOriginHeader + '\n');
          response.headers['access-control-allow-origin'] = origin;
        }
      })
  ).pipe(res);
});

proxy.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, 'public') });
});


proxy.listen(port);

console.log('\n VERCEL Proxy Active \n');
console.log('Proxy Url: ' + cleanproxyDestination);
console.log('Port: ' + port);
console.log('Credentials: ' + credentials);
console.log('Origin: ' + origin);

module.exports = proxy
