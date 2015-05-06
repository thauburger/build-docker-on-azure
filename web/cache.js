var defaultSetId = 'cache';
var redis = require('redis');
var ObjectId = require('mongodb').ObjectId;

var Cache = module.exports = function (setId, cacheItemLimit, cacheIP) {
  this.id = setId || defaultSetId;
  this.limit = cacheItemLimit || 1000;
  this.r = redis.createClient(6379, cacheIP, {});
  return this;
};

Cache.prototype.refreshCache = function (db, pageSize, fn) {
  var self = this;
  self.readDatabase(db, pageSize, function (err, stories) {
    if (err) {
      console.log('DB lookup failed: ', err);
      return fn && fn(err);
    }
    console.log('Found ', stories.length, ' stories! Writing to cache!');
    self.writeToCache(stories, function (err) {
      if (err) {
        console.log('Cache write failed: ', err);
        return fn && fn(err);
      }
      // TODO: Harvest cache if over limit
      fn && fn(null);
    });
  });
};

Cache.prototype.readDatabase = function (db, numStories, fn) {
  var collection = db.collection('stories');
  collection.find({}, { sort: { _id: -1 }, limit: numStories }).toArray(function (err, stories) {
    if (err) {
      console.error('DB lookup failed: ', err);
      return fn && fn(err);
    }
    fn && fn(null, stories);
  });
};

Cache.prototype.writeToCache = function (stories, fn) {
  var i, story, content;
  var completed = 0;

  var done = function () {
    completed++;
    if (completed === stories.length) {
      fn && fn();
    }
  };

  for (i = 0; i < stories.length; i++) {
    story = stories[i];
    var timestamp = new Date((new ObjectId(story._id)).getTimestamp()).getTime();
    console.log('write');
    console.log(JSON.stringify(content));
    this.r.zadd(this.cacheId, timestamp, JSON.stringify(story), function (err) {
      if (err) { return fn && fn(err) };
      done();
    });
  }
};

Cache.prototype.readCache = function (start, numStories, fn) {
  console.log('num stories for cache: ', numStories);
  this.r.zrevrange(this.setId, start,(start + numStories), function (err, stories) {
    if (err) {
      console.error('Cache lookup failed: ', err);
      return fn && fn(err);
    };
    fn && fn(null, stories);
  });
};
