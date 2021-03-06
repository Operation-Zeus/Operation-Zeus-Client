'use strict';

const request = require('request');
const fs = require('fs');
const FeedParser = require('feedparser');
const moment = require('moment');
const Electron = require('electron');
const _ = require('lodash');

let Main = Electron.remote.require('./main.js');
let api = Electron.remote.require('./api.js');
let Podcast = Electron.remote.require('./classes/Podcast.js');

let Zeus = {};

Zeus.podcasts = [];
Zeus.settings = {};

/**
 * Queries iTunes for podcasts
 * @param {String} input
 * @param {Function} callback
 */
Zeus.searchPodcastOnITunes = function (input, callback) {
  let url = `https://itunes.apple.com/search?term=${encodeURIComponent(input)}&country=US&media=podcast`;

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
 * @param {String} url
 * @param {Function} callback
 */
Zeus.fetchPodcastRSS = function(url, callback) {
  let req = request(url);
  let feedparser = new FeedParser();
  let podcast = new Podcast(url);

  // Sometimes we'll get a 400 error without a user-agent
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', (error) => {
    callback(error, null);
  });

  req.on('response', function (res) {
    let stream = this;

    if (res.statusCode != 200) {
      return callback(`Bad status code ${res.statusCode}`, null);
    }

    stream.pipe(feedparser);
  });

  feedparser.on('error', (error) => {
    callback(error, null);
  });

  feedparser.on('readable', function () {
    let stream = this;
    let meta = this.meta;
    let item = {};

    podcast.meta = meta;

    // Keep reading while there is more to read
    while (item = stream.read()) {
      podcast.addEpisode(item);
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
 * @param {Function} callback
 */
Zeus.loadSavedPodcasts = function(callback) {
  fs.readFile(`userdata/podcasts.json`, 'utf8', (err, data) => {
    if (err) {
      api.error(`Failed to read podcasts file - ${err}`);

      Zeus.podcasts = [];
      callback([]);
      return;
    }

    let podcasts = JSON.parse(data);
    for (let i = 0; i < podcasts.length; i++) {
      podcasts[i].loading = false;
    }

    api.log('file', 'Read podcasts file');

    Zeus.podcasts = podcasts;
    callback(podcasts);
  });
};

/**
 * Reads our userdata settings
 * @param {Function} callback
 */
Zeus.loadSettings = function (callback) {
  fs.readFile(`userdata/settings.json`, 'utf8', (err, data) => {
    if (err) {
      api.error(`Failed to read settings file - ${err}`);
      callback({});
      return;
    }

    let settings = JSON.parse(data);
    api.log('file', 'Read settings file');
    callback(settings);
  });
};

/**
 * Saves settings to a file
 * @param {Object} data
 * @param {Function} callback
 */
Zeus.saveSettings = function (data, callback) {
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
 * @param {Podcast} podcast The podcast to be added
 * @return {void}
 */
Zeus.savePodcast = function (podcast) {
  Zeus.podcasts.push(podcast);
  podcast.id = Zeus.podcasts.indexOf(podcast);
  podcast.imageURL = podcast.meta['itunes:image']['@'].href;

  if (Zeus.settings.cacheImages) {
    podcast.imageURL = `../../userdata/cached/${podcast.id}`;
    podcast.updateCachedImage();

    for (let i = 0; i < podcast.episodes.length; i++) {
      podcast.episodes[i].imageURL = `../../userdata/cached/${podcast.episodes[i].hash}`;
    }

    podcast.updateCachedEpisodeImages();
  }

  Zeus.updatePodcastFile();
};

/**
 * Adds a podcast to our selection
 * @param {String} url - The RSS feed URL
 * @param {Function} callback
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
 * @param {Podcast} podcast - The podcast we are checking
 */
Zeus.updatePodcast = function (podcast, callback) {
  podcast.loading = true;

  Zeus.fetchPodcastRSS(podcast.rssURL, (error, newPodcastInfo) => {
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
 * @param {int} podcastId
 */
Zeus.removePodcast = function(podcastId) {
  Zeus.podcasts.splice(podcastId, 1);

  // Fix our ids
  for (let i = 0; i < Zeus.podcasts.length; i++) {
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
 * Updates a current downloaded
 * @param {Podcast} podcast
 */
Zeus.updateSavedPodcast = function (podcast) {
  Zeus.podcasts[podcast.id] = podcast;

  Zeus.updatePodcastFile();
};

/**
 * Our own "version" of a deep extend. Cause we can :D
 * @description This primarily only updates the episodes -- adding new while keeping the old.
 * @param {Podcast} oldPodcast - The target
 * @param {Podcast} newPodcast - The source
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
