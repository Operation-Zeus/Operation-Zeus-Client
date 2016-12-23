'use strict';

const fs = require('fs');
const api = Electron.remote.require('../api.js');

class Episode {
  constructor() {

  }

  beautifyEpisode() {

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
