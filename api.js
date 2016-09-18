const moment = require('moment');
const crypto = require('crypto');

var api = {};

/**
 * Logs with a timestamp
 * @param {STRING} tag
 * @param {STRING} message
 */
api.log = function(tag, message) {
  var timestamp = moment.utc().format('YYYY-MM-DD hh:mm:ss');
  var tag = '';
  switch (tag) {
    case 'request':
      tag = '{REQUEST}'
      break;
    case 'file':
      tag = '{FILE}';
      break;
    case 'error':
      tag = '{ERROR}';
      break;
    default:
      tag = '';
  }

  console.log(`${timestamp} ${tag} ${message}`);
};

/**
 * Formats an input in seconds -> x hr y min
 * @param {INT} seconds
 */
api.formatSecondsToWords = function (seconds) {
  var d = moment.duration(parseInt(seconds), 'seconds');
  var response = `${d.hours()} hr ${d.minutes()} min`;
  return response;
};

/**
 * Formats input in seconds -> hours:min:seconds
 * @param {INT} seconds
 */
api.formatSecondsToHoursMinutesSeconds = function (seconds) {
  var d = moment.duration(parseInt(seconds), 'seconds');
  var response = `${d.hours()}:${d.minutes()}:${d.seconds()}`;
  return response;
};


/**
 * Creates an MD5 hash for a given input
 * @param {STRING} input
 */
api.md5 = function (input) {
  var hash = crypto.createHash('md5').update(input).digest('hex');
  return hash;
};

module.exports = api;
