'use strict';

const fs = require('fs');
const moment = require('moment');
const api = Electron.remote.require('../api.js');

class Episode {
  constructor() {

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

  downloadEpisode() {

  }

  /**
   * Deletes the episode in question
   * @return {void}
   */
  deleteEpisode() {
    let episode = this;

    fs.unlink(`userdata/podcasts/${episode.md5}.mp3`, function (error) {
      if (error) {
        callback(false);
      }

      callback(true);
    });
  }
}

module.exports = Episode;
