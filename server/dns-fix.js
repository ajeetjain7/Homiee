const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

module.exports = dns;