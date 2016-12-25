'use strict';

const request = require('request');

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
    this.loading = false;
    this.imageURL = '';
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

  savePodcast() {

  }

  updatePodcast() {

  }

  removePodcast() {

  }

  updateCachedImage() {

  }
}

module.exports = Podcast;
