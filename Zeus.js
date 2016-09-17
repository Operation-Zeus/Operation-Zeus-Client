const request = require('request');
const fs = require('fs');
const FeedParser = require('feedparser');
const moment = require('moment');
const Electron = require('electron');

var Main = Electron.remote.require('./main.js');
var api = Electron.remote.require('./api.js');
var Zeus = {};

Zeus.podcasts = [];
Zeus.settings = {};

/**
 * Fetches the XML from an RSS feed
 * @param {STRING} url
 * @param {BOOLEAN} newPodcast
 * @param {INT} id
 * @param {FUNCTION} callback
 */
Zeus.fetchPodcastRSS = function(url, newPodcast, id, callback) {
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
    while (item = stream.read()) {
      podcast.podcasts.push(item);
    }
  });

  feedparser.on('error', (err) => {
    callback(err, null);
  });

  feedparser.on('end', () => {
    podcast.loading = false;
    Zeus.savePodcast(podcast, newPodcast, id);
    callback(null, podcast, id);
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
//   fs.readFile('userdata/podcasts.json', function (err, data) {
//     if (err) {
//       api.log('error', 'No podcast file found');
//       Zeus.podcasts = [];
//       return callback([]);
//     }
//
//     data = JSON.parse(data);
//     Zeus.podcasts = data;
//     return callback(data);
//   });
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

  // fs.writeFileSync(`userdata/settings.json`, JSON.stringify(data));
  // api.log('file', 'Saved user settings');

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
Zeus.savePodcast = function(podcast, newPodcast, id) {
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

  if (newPodcast) {
    Zeus.podcasts.push(podcast);
    podcast.id = Zeus.podcasts.indexOf(podcast);
  } else {
    podcast.id = id;
    Zeus.podcasts[id] = podcast;
  }

  podcast.imageURL = Zeus.settings.cacheImages ? `../../userdata/cached/${podcast.id}` : podcast.meta['itunes:image']['@'].href;

  Zeus.updatePodcastFile();

  if (Zeus.settings.cacheImages) {
    Zeus.updateCachedImage(podcast);
  }
};

/**
 * Removes a podcast from our array / file
 * @param {PODCAST} podcast
 */
Zeus.removePodcast = function(podcast) {
  Zeus.podcasts.splice(podcast.id, 1);
};

/**
 * Writes the podcasts file to JSON
 */
Zeus.updatePodcastFile = function () {
  // fs.writeFileSync(`userdata/podcasts.json`, JSON.stringify(Zeus.podcasts));
  // api.log('file', `Wrote podcast data to podcasts.json, ${Zeus.podcasts.length}`);

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
        console.log(`The size isn't the same yet! ${curr.size} ${prev.size}`);
        callback(null, true, curr.size / sizeOfFile);
        notSame = true;
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
