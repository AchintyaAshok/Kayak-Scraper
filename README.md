# Kayak-Scraper
This is an open-source node library that you can use to scrape flight information from Kayak. Note: This is an unofficial library and for testing purposes only. If you wish to get data from Kayak, please do so using their own APIs.

## Installation
```bash
npm install kayak-scraper
```

## Usage
```javascript
var kayak = require('kayak');
kayak.getTripDetails("JFK", "SFO", new Date(2016, 10, 18), new Date(2016, 10, 26));
```
This will get you cheapest flights from JFK to SFO between October 18th and October 26th, 2016.
