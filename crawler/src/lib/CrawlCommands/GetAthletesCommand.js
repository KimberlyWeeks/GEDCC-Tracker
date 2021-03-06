/**
 * Crawl command
 */

const _ = require('lodash');
const promiseWhile = require('./../utils/promiseWhile');
const AbstractCommand = require('./AbstractCommand');

class GetAthletesCommand extends AbstractCommand {

  _run() {
    this._createClient();

    // login
    return this._loginToStrava()

      // get athletes
      .then(() => this._getAthletes())
      .then(v => this._writeOutput(v))

      // done
      .end();
  }

  /**
   * Get all athlete ids
   * @return {Promise}
   * @private
   */
  _getAthletes() {
    let page = 1,
      stop = false,
      athletes = {};

    return new Promise((resolve, reject) => {
      promiseWhile(
        () => !stop,
        () => {
          return this._client
            .url(`https://www.strava.com/clubs/${this.stravaClubId}/members?page=${page++}`)
            .waitForExist('.list-athletes')
            .isVisible('.next_page.disabled').then(v => {
              if (v) stop = true;
            })
            .getHTML('.list-athletes')
            .then(v => {
              v = v.join('').replace(/\n/g, ' ');
              const m = v.match(/alt="([^"]+)".+?src="([^"]+)".+?\/athletes\/(\d+)/g);
              const a = m.map(v => v.match(/alt="([^"]+)".+?src="([^"]+)".+?\/athletes\/(\d+)/));
              a.forEach(e => athletes[e[3]] = {name: e[1], pic: e[2], id: e[3]});
            });
        }
      ).then(() => {
        this._debug('Total athletes: ', _.values(athletes).length);
        resolve(athletes);
      }, reject);
    });
  }
}

module.exports = GetAthletesCommand;
