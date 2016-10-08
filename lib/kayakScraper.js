var cheerio = require("cheerio");
var request = require("request");
var Promise = require("bluebird");
var path    = require('path');

const HTTP_STATUS_OK = 200;
const MOCK_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36";
const KAYAK_URL = "https://www.kayak.com";

// Temporary before we start using the Mongo Interface
const AIRPORT_CODES = {
  JFK: "New York City",
  ATH: "Athens",
  MLA: "Malta",
  MIA: "Miami",
  IAD: "Washington D.C.",
};

// To pretty-print the month names
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* Returns the details for departure time, departure date,
arrival time, arrival gate */
function getFlightTimeDetails(timeBox){
  // Departure Details
  var depTimeElem = timeBox.children("div.flightTimeDeparture");
  var depTime = depTimeElem.text().replace(/[\n]/g, "");
  var depLocElem = depTimeElem.next();
  var depLocShortName = depLocElem.text().replace(/[ \n]/g, "");
  var depLocLongName = depLocElem.attr("title");
  // Arrival Details
  var arvTimeElem = timeBox.children("div.flightTimeArrival");
  var arvTime = arvTimeElem.text().replace(/[\n]/g, "");
  var arvLocElem = arvTimeElem.next();
  var arvLocShortName = arvLocElem.text().replace(/[ \n]/g, "");
  var arvLocLongName = arvLocElem.attr("title");
  return({
    departure: {
      time: depTime,
      location: {
        shortName: depLocShortName,
        longName: depLocLongName
      }
    },
    arrival: {
      time: arvTime,
      location: {
        shortName: arvLocShortName,
        longName: arvLocLongName
      }
    }
  });
}

/* Formats the given date in the following format: YYYY-MM-DD */
function getFormattedDate(d){
  var startDay = d.getDate();
  if(startDay < 10) startDay = "0" + startDay;
  var startMonth = d.getMonth() + 1; // months are 0-indexed in javascript.. god knows why
  if(startMonth < 10) startMonth = "0" + startMonth;
  return(d.getFullYear() + "-" + startMonth + "-" + startDay);
}

/* This function stores trip details for the information provided. It will retreive trip
details from Kayak and store it in a local JSON file. */
function getTripDetails(sourceCity, destCity, startDate, endDate){
  console.info("Retreiving trip details:\n" + sourceCity + " - " + destCity);
  // Format the date string
  var formattedStartDate = exports.getFormattedDate(startDate);
  var formattedEndDate = exports.getFormattedDate(endDate);
  console.info("Dates: " + formattedStartDate + " to " + formattedEndDate);

  var requestUrl =  KAYAK_URL + "/flights/" + sourceCity + "-" + destCity + "/" + formattedStartDate + "/" + formattedEndDate;
  console.info("Requesting url... " + requestUrl);

  return new Promise(function(resolve, reject){
    request(
      {
        uri: requestUrl,
        method: "GET",
        headers: {
          "user-agent": MOCK_USER_AGENT
        }
      },
      function (error, response, html) {
        if(error || response.statusCode != HTTP_STATUS_OK){
          reject(error);
        }
        var $ = cheerio.load(html);

        // Check the number of results we have
        var numResults = $("div.flightresult").length;
        console.log("Number of results: ", numResults);
        if(numResults == 0){
          console.log("No results found...");
          reject("Unable to find any results");
        }

        // All our flight details
        var allFlightDetails = {
          sourceCity:     sourceCity,
          sourceCityName: AIRPORT_CODES[sourceCity],
          destCity:       destCity,
          destCityName:   AIRPORT_CODES[destCity],
          timeInterval: {
            startDate:          startDate.getTime(), // get the millisecond value for easy conversion
            formattedStartDate: formattedStartDate,
            startMonthName:     MONTH_NAMES[startDate.getMonth()],
            endDate:            endDate.getTime(),
            formattedEndDate:   formattedEndDate,
            endMonthName:       MONTH_NAMES[endDate.getMonth()],
            numDays:            endDate.getDate() - startDate.getDate(),

          },
          queryUrl: requestUrl,
          bestOffer: {}
        };

        // Keep track of the lowest prices
        var lowestPrice = Number.MAX_VALUE;

        // All the flights
        var flights = [];
        $("div.flightresult").each(function(i, element){
          var flightIndex = $(this).attr("data-index");
          var detailsBoxId = "#infolink" + String(flightIndex);
          var detailsBox = $(detailsBoxId);

          // Get the pricing information
          var priceTag = detailsBox.children("div.maindatacell")
            .children("div.mainInfoDiv")
            .children("div.pricerange")
            .children("a.bookitprice");
          var price = priceTag.text();
          price = parseFloat(price.substr(1));
          if(isNaN(price)){
            console.log("This price is not a number..", price);
            return; // jquery each loop uses this rather than continue
          }
          console.info("Price -> ", price);
          var offerLink = priceTag.attr("href");

          // Get Airline information
          var airlineInfo = detailsBox.children("div.tripdetailholder")
            .children("div.airlineAndLegs")
            .children("div.legholder")
            .children();
          // Departure Leg
          var departLeg = airlineInfo.first(); // get the to leg
          var departLegDetails = getFlightTimeDetails(departLeg);
          // Return Leg
          var retLeg = departLeg.next();
          var returnLegDetails = getFlightTimeDetails(retLeg);
          var flightDetails = {
            price:      price,
            departLeg:  departLegDetails,
            returnLeg:  returnLegDetails,
            link:       KAYAK_URL + offerLink
          };
          if(price < lowestPrice){
            console.log("New Best Offer! ", price);
            lowestPrice = price;
            allFlightDetails.bestOffer = flightDetails;
          }
          flights.push(flightDetails);
        });
        allFlightDetails.flights = flights;
        resolve(allFlightDetails);
      }
    );
  });
}

var exports = module.exports = {
  getFormattedDate:  getFormattedDate,
  getTripDetails:    getTripDetails
};
