/// <reference path="../typings/node/node.d.ts"/>

/**
 * server-sms.js
 * simple web server for receiving SMS messages from Twilio.
 * Build 2015
 */

var express = require('express');
var app = express();
var parse = require('url');
var twilio = require('twilio');

/**
 * MongoDB
 */

// TODO: move db container link to ENV variable
var mongoClient = require('mongodb').MongoClient;
var mongoConnection = 'mongodb://db:27017/demo';
var db = null;

mongoClient.connect(mongoConnection, function (err, database) {
  if (err) {
    console.error('Could not connect to mongoDB: ', err);
    return;
  }
  db = database;
});

var writeStoryToDatabase = function (story, fn) {
  db.collection('stories').insert(story, function (err, saved) {
    if (err) { return console.error('Submission failed: ', err); }
    console.log(story);
    console.log('New Submission from ', story.fromCity, ', ', story.fromCountry, '! : ' + story.title);
  });
};

/**
 * App middleware + routing
 */

var logRequest = function (req, res, next) {
  console.log("\n[" + Date.now() + "]: " + req.method + '/\n');
  next();
};

app.use(logRequest);
app.use(express.static('public'));

app.get('/', function (req, res) {

  var queryData = parse.parse(req.url, true).query;
  
  // Validate that it's from Twilio. Placeholder check for demo.
  if (queryData.MessageSid) {

    var url = "";
    var host = "";
    var title = decodeURIComponent(queryData.Body);

    title = title.trim();

    // Markdown link support    
    if (title.indexOf('[') === 0 && title.indexOf(')') === title.length - 1) {
      var parts = title.split('(');
      title = parts[0].substring(1, parts[0].length - 1);
      url = parts[1].substring(0, parts[1].length - 1);
      url = url.replace(/"/g, '');
      url = url.replace(/'/g, '');
      host = parse.parse(url, true).hostname;
    }

    title = title.replace(/</g, '&rt;');
    title = title.replace(/>/g, '&lt;');
    
    var submission = {
      fromCity: queryData.FromCity,
      fromCountry: queryData.FromCountry,
      title: title,
      url: url,
      host: host
    };

    writeStoryToDatabase(submission, function (err, saved) {
      if (err) { return console.error('Story save failed: ', err); }
      var resp = new twilio.TwimlResponse();
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(resp.toString());
    });

  } else { // Not a Twilio message...
    res.status(404).send('Not Found !!!');
  }

});

// Start SMS server 
var port = process.env.PORT || 4000;
var server = app.listen(port, function () {
  console.log('SMS server running on port: ', port);
});