const request = require('request');
const fs = require('fs');
const FeedParser = require('feedparser');
const moment = require('moment');
const Electron = require('electron');
const _ = require('lodash');

var Main = Electron.remote.require('./main.js');
var api = Electron.remote.require('./api.js');
var Zeus = {};

Zeus.podcasts = [];
Zeus.settings = {};

/**
 * Queries iTunes for podcasts
 * @param {STRING} input
 * @param {FUNCTION} callback
 */
Zeus.searchPodcastOnITunes = function (input, callback) {
  var url = `https://itunes.apple.com/search?term=${encodeURIComponent(input)}&country=US&media=podcast`;

  request(url, (error, response, body) => {
    if (error || response.statusCode != 200) {
      return callback(new Error('Failed to find podcasts'), null);
    }

    api.log('request', `Searched podcasts for ${input}`);
    body = JSON.parse(body);
    callback(null, body);
  });
};

/**
 * Fetches the XML from an RSS feed
 * @param {STRING} url
 * @param {BOOLEAN} newPodcast
 * @param {INT} id
 * @param {FUNCTION} callback
 */
Zeus.fetchPodcastRSS = function(url, callback) {
  var req = request(url);
  var feedparser = new FeedParser();
  var podcast = {};
  podcast.podcasts = [];
  podcast.rssUrl = url;

  // Sometimes we'll get a 400 error without a user-agent
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', (error) => {
    callback(error, null);
  });

  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) {
      return callback(`Bad status code ${res.statusCode}`, null);
    }

    stream.pipe(feedparser);
  });

  feedparser.on('error', (error) => {
    callback(error, null);
  });

  feedparser.on('readable', function () {
    var stream = this;
    var meta = this.meta;
    var item;

    podcast.meta = meta;

    // Keep reading while there is more to read
    while (item = stream.read()) {
      podcast.podcasts.push(item);
    }
  });

  feedparser.on('error', (err) => {
    callback(err, null);
  });

  feedparser.on('end', () => {
    callback(null, podcast);
  });
};

/**
 * Reads our podcasts from the JSON file
 * @param {FUNCTION} callback
 */
Zeus.loadSavedPodcasts = function(callback) {
  var data = [];
  if (fs.existsSync('userdata/podcasts.json')) {
    data = JSON.parse(fs.readFileSync('userdata/podcasts.json'));
  }

  for (var podcast = 0; podcast < data.length; podcast++) {
    data[podcast].loading = false;

    for (var episode = 0; episode < data[podcast].podcasts.length; episode++) {
      data[podcast].podcasts[episode].hash = api.md5(data[podcast].podcasts[episode].guid);
      data[podcast].podcasts[episode].id = episode;
      data[podcast].podcasts[episode].isDownloaded = fs.existsSync(`userdata/podcasts/${data[podcast].podcasts[episode].hash}.mp3`);
    }
  }

  Zeus.podcasts = data;
  return callback(data);
};

/**
 * Reads our userdata settings
 * @param {FUNCTION} callback
 */
Zeus.loadSettings = function(callback) {
  var data = {};
  if (fs.existsSync('userdata/settings.json')) {
    api.log('file', 'Read settings file');
    data = JSON.parse(fs.readFileSync('userdata/settings.json'));
  }

  callback(data);
};

/**
 * Saves settings to a file
 * @param {OBJECT} data
 * @param {FUNCTION} callback
 */
Zeus.saveSettings = function(data, callback) {
  fs.writeFile(`userdata/settings.json`, JSON.stringify(data), (err) => {
    if (err) {
      throw err;
    }

    api.log('file', 'Saved user settings');
    callback ? callback(true) : false;
  });
};

/**
 * Saves a podcast to our array / file
 * @param {PODCAST} podcast
 * @param {BOOLEAN} newPodcast
 * @param {INT} id
 */
Zeus.savePodcast = function(podcast) {
  Zeus.beautifyEpisodes(podcast);

  Zeus.podcasts.push(podcast);
  podcast.id = Zeus.podcasts.indexOf(podcast);
  podcast.imageURL = podcast.meta['itunes:image']['@'].href;

  if (Zeus.settings.cacheImages) {
    podcast.imageURL = `../../userdata/cached/${podcast.id}`;
    Zeus.updateCachedImage(podcast);
  }

  Zeus.updatePodcastFile();
};

/**
 * Adds a podcast to our selection
 * @param {STRING} url - The RSS feed URL
 * @param {FUNCTION} callback
 */
Zeus.addPodcast = function (url, callback) {
  Zeus.fetchPodcastRSS(url, (error, podcast) => {
    if (error) {
      callback(error, null);
      return;
    }

    podcast.loading = false;
    Zeus.savePodcast(podcast);
    callback(null, podcast);
  });
};

/**
 * Fetches podcast from RSS url, updates changes
 * @param {PODCAST} podcast - The podcast we are checking
 */
Zeus.updatePodcast = function (podcast, callback) {
  podcast.loading = true;

  Zeus.fetchPodcastRSS(podcast.rssUrl, (error, newPodcastInfo) => {
    if (error) {
      callback(error, null);
      return;
    }

    // Ya, ya, I know. Piggy-backing off of lodash because I can. (And hell, it looks cooler... :D)
    _.mergePodcastInformation(podcast, newPodcastInfo);
    Zeus.beautifyEpisodes(podcast);

    callback(null, podcast);
  });
};

/**
 * Removes a podcast from our array / file
 * @param {INT} podcastId
 */
Zeus.removePodcast = function(podcastId) {
  Zeus.podcasts.splice(podcastId, 1);

  // Fix our ids
  for (var i = 0; i < Zeus.podcasts.length; i++) {
    Zeus.podcasts[i].id = i;
  }

  Zeus.updatePodcastFile();
};

/**
 * Writes the podcasts file to JSON
 */
Zeus.updatePodcastFile = function () {
  fs.writeFile(`userdata/podcasts.json`, JSON.stringify(Zeus.podcasts), (err) => {
    if (err) {
      throw error;
    }

    api.log('file', `Wrote podcast data to podcasts.json, ${Zeus.podcasts.length}`);
  });
};

/**
 * Re-downloads the images
 * @param {PODCAST} podcast
 */
Zeus.updateCachedImage = function (podcast) {
  var url = podcast.meta['itunes:image']['@'].href;
  var file = fs.createWriteStream(`userdata/cached/${podcast.id}`);
  var req = request(url);

  // Sometimes we'll get a 400 error without a user-agent
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', (error) => {
    api.log('error', `Failed to download image for podcast ${podcast.meta.title}, ${error}`);
  });

  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) {
      api.log('error', `Bad status code ${res.statusCode}`);
      return;
    }

    api.log('file', `Piping download for image of podcast ${podcast.meta.title}`);
    stream.pipe(file);
  });
};

/**
 * Updates a current downloaded
 * @param {PODCAST} podcast
 */
Zeus.updateSavedPodcast = function (podcast) {
  Zeus.podcasts[podcast.id] = podcast;

  Zeus.updatePodcastFile();
};

/**
 * Downloads the .mp3 from the server
 * @param {PODCAST} podcast
 */
Zeus.downloadEpisode = function (podcast, callback) {
  var url = podcast['rss:enclosure']['@'].url;
  var file = fs.createWriteStream(`userdata/podcasts/${podcast.hash}.mp3`);
  var req = request(url);

  // Sometimes we'll get a 400 error without a user-agent
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', (error) => {
    console.log('Failed to download!');
    callback(error, null);
  });

  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) {
      return callback(`Bad status code ${res.statusCode}`, null);
    }

    console.log('Piping download!');
    stream.pipe(file);

    var notSame = true;
    var sizeOfFile = parseInt(res.headers['content-length']);

    // Track the size of the file, to upload our download bar.
    var fileWatcher = fs.watchFile(`userdata/podcasts/${podcast.hash}.mp3`, {  persistent: true, interval: 500 }, (curr, prev) => {
      if (curr != prev) {
        notSame = true;

        callback(null, true, curr.size / sizeOfFile);
        return;
      }
    });

    // The file listener stops calling once prev = curr (grumble grumble), so we have to keep track of when that happens with an interval
    var checkInterval = setInterval(function () {
      if (!notSame) {
        api.log('file', `Unwatching file...`);
        fs.unwatchFile(`userdata/podcasts/${podcast.hash}.mp3`);

        clearInterval(checkInterval);
        callback(null, true, 1);
      }

      notSame = false;
    }, 2500);
  });
};

/**
 * Deletes the .mp3 from the client
 * @param {PODCAST} podcast
 */
Zeus.deleteEpisode = function (podcast, callback) {
  fs.unlinkSync(`userdata/podcasts/${api.md5(podcast.guid)}.mp3`);

  callback(true);
  // fs.unlink(`userdata/podcasts/${api.md5(podcast.guid)}.mp3`, function (err) {
  //   if (err) {
  //     throw error;
  //   }
  //
  //   callback(success);
  // });
};

/**
 * Goes through each podcast episode, and makes the time readable, assigns id to index, etc.
 * @param {PODCAST} podcast
 */
Zeus.beautifyEpisodes = function (podcast) {
  for (var i = 0; i < podcast.podcasts.length; i++) {
    podcast.podcasts[i].pubDateParsed = moment(podcast.podcasts[i].pubDate).format('MMMM DD, YYYY');
    podcast.podcasts[i].id = i;

    if (podcast.podcasts[i]['itunes:duration']['#'].includes(':')) {
      podcast.podcasts[i].podcastLengthParsed = podcast.podcasts[i]['itunes:duration']['#'];
      continue;
    }

    podcast.podcasts[i].podcastLength = api.formatSecondsToHoursMinutesSeconds(podcast.podcasts[i]['itunes:duration']['#']);
    podcast.podcasts[i].podcastLengthParsed = api.formatSecondsToWords(podcast.podcasts[i]['itunes:duration']['#']);
    podcast.podcasts[i].currentTime = 0;
    podcast.podcasts[i].watched = false;
  }
};

/**
 * Our own "version" of a deep extend. Cause we can :D
 * @description This primarily only updates the episodes -- adding new while keeping the old.
 * @param {PODCAST} oldPodcast - The target
 * @param {PODCAST} newPodcast - The source
 */
_.mergePodcastInformation = function (oldPodcast, newPodcast) {
  if (_.isEqual(oldPodcast.meta, newPodcast.meta) && oldPodcast.podcasts.length == newPodcast.podcasts.length) {
    return;
  }

  var episodeDifference = newPodcast.podcasts.length - oldPodcast.podcasts.length
  oldPodcast.meta = newPodcast.meta;

  // Loop over backwards, that way the newest episodes are in the front
  for (var i = episodeDifference; i > 0; i--) {
    oldPodcast.podcasts.unshift(newPodcast.podcasts[i - 1]);
  }
};
