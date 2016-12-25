'use strict';

const fs = require('fs');
const moment = require('moment');

const api = require('../api.js');

class Episode {
  /**
   * Initializes the Episode
   * @param  {Object} data An object containing information from the stream reader
   * @return {void}
   */
  constructor(data) {
    this.author = data.author;
    this.id = data.id;
    this.description = data.description;
    this.summary = data.summary;
    this.imageURL = data.imageURL;
    this.date = this.pubDate = data.date;
    this.source = data.source;
    this.guid = data.guid;
    this.title = data.title;
    this.rssURL = data.rssURL;

    this.downloading = false;
    this.isDownloaded = false;
    this.hash = api.md5(this.guid);

    this.beautify(this.id);
  }

  /**
   * Beautifies all the episode variables.
   * @param  {int} index The new index of the episode (set to the ID)
   * @return {void}
   */
  beautify(index) {
    let episode = this;

    episode.pubDateParsed = moment(episode.pubDate).format('MMMM DD, YYYY');
    episode.id = index;

    // Sometimes the length is already parsed.
    if (episode['itunes:duration']['#'].includes(':')) {
      episode.podcastLengthParsed = episode['itunes:duration']['#'];
    } else {
      episode.podcastLengthParsed = api.formatSecondsToWords(episode['itunes:duration']['#']);
    }

    episode.podcastLength = api.formatSecondsToHoursMinutesSeconds(episode['itunes:duration']['#']);
    episode.currentTime = 0;
    episode.watched = false;
  }

  /**
   * Download the episode to our userdata folder
   * @param  {Function} callback Called each time the download progresses, and finally when it finishes
   * @return {void}
   */
  downloadEpisode(callback) {
    let episode = this;

    let url = episode.rssURL
    let file = fs.createWriteStream(`userdata/podcasts/${episode.hash}.mp3`);
    let req = request(url);

    // Sometimes we'll get a 400 error without a user-agent, so let's fake some headers
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    req.on('error', (error) => {
      api.error(`Failed to download episode, ${error}`);
      callback(error, null);
    });

    req.on('response', function (res) {
      let stream = this;

      if (res.statusCode != 200) {
        return callback(`Bad status code ${res.statusCode}`, null);
      }

      api.log('request', `Piping download of episode ${episode.id}`);
      stream.pipe(file);

      let notSame = true;
      let sizeOfFile = parseInt(res.headers['content-length']);

      // Track the size of the file, to upload our download bar.
      let fileWatcher = fs.watchFile(`userdata/podcasts/${episode.hash}.mp3`, {  persistent: true, interval: 500 }, (curr, prev) => {
        if (curr != prev) {
          notSame = true;

          callback(null, true, curr.size / sizeOfFile);
          return;
        }
      });

      // The file listener stops calling once curr == prev (grumble grumble), so we have to keep track of when that happens with an interval
      // We set notSame to false every 2.5 seconds, and it will be re-set back to true if the watcher is still calling
      let checkInterval = setInterval(() => {
        if (!notSame) {
          api.log('file', `Unwatching file...`);
          fs.unwatchFile(`userdata/podcasts/${episode.hash}.mp3`);

          clearInterval(checkInterval);
          callback(null, true, 1);
        }

        notSame = false;
      }, 2500);
    });
  }

  /**
   * Deletes the episode in question
   * @return {void}
   */
  deleteEpisode() {
    let episode = this;

    fs.unlink(`userdata/podcasts/${episode.hash}.mp3`, function (error) {
      if (error) {
        callback(false);
      }

      callback(true);
    });
  }

  /**
   * Fetches the episode image, saves it to a file
   * @return {void}
   */
  updateCachedImage() {
    let episode = this;

    let url = episode.imageURL;
    let file = fs.createWriteStream(`userdata/cached/${episode.hash}`);
    let req = request(url);

    // Sometimes we'll get a 400 error without a user-agent
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    req.on('error', (error) => {
      api.log('error', `Failed to download image for episode ${episode.title}, ${error}`);
    });

    req.on('response', function (res) {
      let stream = this;

      if (res.statusCode != 200) {
        api.log('error', `Bad status code ${res.statusCode}`);
        return;
      }

      api.log('file', `Piping download for image of episode ${episode.title}`);
      stream.pipe(file);
    });
  }
}

module.exports = Episode;
