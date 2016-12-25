'use strict';

const request = require('request');
const fs = require('fs');

const api = require('../api.js');
const Episode = require('./Episode.js');

class Podcast {
  /**
   * Initializes the podcast
   * @param  {String} url The URL of the RSS feed
   * @return {void}
   */
  constructor(url) {
    this.meta = {};
    this.episodes = [];
    this.rssURL = url;
    this.loading = true;
    this.imageURL = '';

    this.id = null;
  }

  /**
   * Creates a new episode from the stream reader data
   * @param {Object} data Stream reader information
   * @return {void}
   */
  addEpisode(data) {
    let episode = new Episode({
      author: data.author || data['itunes:author']['#'],
      id: this.episodes.length,
      date: data.date,
      description: data.description,
      summary: data.summary,
      imageURL: data['itunes:image']['@'].href,
      source: data.link,
      guid: data.guid,
      length: data['itunes:duration']['#'],
      tite: data.title
    });

    this.episodes.push(episode);
  }

  updatePodcast() {

  }

  removePodcast() {

  }

  /**
   * Fetches the podcast image, saves it to a file
   * @return {void}
   */
  updateCachedImage() {
    let podcast = this;

    let url = podcast.imageURL;
    let file = fs.createWriteStream(`userdata/cached/${podcast.id}`);
    let req = request(url);

    // Sometimes we'll get a 400 error without a user-agent
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    req.on('error', (error) => {
      api.log('error', `Failed to download image for podcast ${podcast.meta.title}, ${error}`);
    });

    req.on('response', function (res) {
      let stream = this;

      if (res.statusCode != 200) {
        api.log('error', `Bad status code ${res.statusCode}`);
        return;
      }

      api.log('file', `Piping download for image of podcast ${podcast.meta.title}`);
      stream.pipe(file);
    });
  }

  /**
   * Loops through each episode, runs the update call
   * @return {void}
   */
  updateCachedEpisodeImages() {
    let podcast = this;

    for (let i = 0; i < podcast.episodes.length; i++) {
      podcast.episodes[i].updateCachedImage();
    }
  }
}

module.exports = Podcast;
