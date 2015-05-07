/**
 * server.js
 * Front-end node server for Azure News demo.
 * BUILD/Ignite 2015, Tom Hauburger <thauburg@microsoft.com>
 */

var express = require('express');
var path = require('path');
var util = require('util');
var app = express();

/**
 * App Constants
 */

var storiesPerPage = 30;
var sampleStories = require('./sample-stories.js').stories;

/**
 * Database & Cache: Mongo w/ Redis
 */

var mongoClient = require('mongodb').MongoClient;
var mongoConnection = 'mongodb://db:27017/demo';  // Container linking!!
var mongoDB = null;

var Cache = require('./cache.js');
var cacheId = "storycache";
var cacheItemLimit = 500;
var redisIP = 'cache';                            // Container linking!!
var cache = null;

mongoClient.connect(mongoConnection, function(err, database) {
  if (err) {
    console.error('Could not connect to mongoDB: ', err);
    return;
  }
  mongoDB = database;
  cache = new Cache(cacheId, cacheItemLimit, redisIP);
  cache.writeToCache(sampleStories, function (err) {
    if (err) { return console.error('Cache prep failed: ', err);}
    cache.refreshCache(mongoDB, storiesPerPage, function (err) {
      if (!err) { console.log('Cache initialized'); }
    });
  });
});

/**
 * App middleware + routing
 */
                    
var logRequest = function(req, res, next) {
  console.log("[" + Date.now() + "]: " + req.method + " " + req.url);
  next();
};

app.use(logRequest);
app.use(express.static('public'));

app.get('/updates', function (req, res) {
  if (!cache) {
    return res.send(JSON.stringify(sampleStories));
  }
  cache.readCache(0, storiesPerPage, function (err, stories) {
    if (err) {
      res.send('Could not read the latest stories!');
      return res.end();
    }
    res.send(JSON.stringify(stories));
  });
});

app.get('/', function(req, res) {
  var indexPath = path.join(__dirname, 'views/index.html');
  res.sendFile(indexPath);
});


// Start server + start pulling from database

var port = process.env.PORT || 3000;
var refreshInterval = process.env.REFRESH_INTERVAL || 2500;

var server = app.listen(port, function () {
  console.log('Azure News server running on port: ', port);
  setInterval(function () {
    if (cache) {
      cache.refreshCache(mongoDB, storiesPerPage, function (err) {
        if (err) { console.error('Cache refresh failed.'); }
      });
    }
  }, refreshInterval);
});
