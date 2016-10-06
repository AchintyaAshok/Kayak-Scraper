var path = require('path');
var kayak = require(path.join(__dirname, "lib/kayakScraper.js"));

// export whatever the kayak library exports
module.exports = kayak;
