var async = require('async');
var fs = require('fs');
var moment = require('moment');
var uuid = require('node-uuid');
var spawn = require('child_process').spawn;
var request = require('request');

// constructor
//function Recorder(streams, startTime, duration, description) {
function Recorder(station, schedule) {
    //console.log(station);
    this.streams = station.streams;
    this.recording = {
        station: schedule.station,
        stationName: station.name,
        date: schedule.start,
        duration: Number(schedule.duration),
        description: schedule.description,
        tags: [],
        path: './tmp/',
        filename: uuid.v4()
    };
}

// activate a stream
Recorder.prototype.activate = function(callback) {
    // scheduling
    var now = moment();
    var start = moment(this.recording.date, 'DD/MM/YYYY HH:mm');
    var wait = moment.duration(start.valueOf() - now.valueOf());
    // recording
    var duration = moment.duration(this.recording.duration, 'minutes').valueOf();
    var filename = this.recording.filename;
    var path = this.recording.path;
    var streams = this.streams;

    // if url is a container format (m3u or pls) then
    // we need to request it first to get the actual streaming url
    async.map(streams, uncontain, function(err, results) {
        if (!err) {
            setTimeout(function() {
                record(duration, results, path, filename, callback);
            }, wait.valueOf());
        } else {
            console.log('[ERROR. ' + err + ']');
        }
    });
}

/*
 * record information from a stream
 */
function record(duration, streams, path, filename, callback) {

    var start = moment();
    var elapsed = 0;
    var url = streams[0];
    var re = /^http/i;
    var stream;
    var ext = '';
    var lol = false;

    console.log('[Begin Recording. url=' + url + ', file=' + filename + ', duration=' + duration + ']');

    if (url.search(re) == 0) {
        // Why did they change the API? It was much nicer before.
        request
            .get(url)
            .on('data', function(chunk) {
                var now = moment();
                elapsed = now.valueOf() - start.valueOf();

                if (elapsed < duration) {
                    fs.appendFile(path + filename, chunk, function(err) {
                        if (err) {
                            console.log('[ERROR. Could not write to file: ' + filename + ']');
                        }
                    });
                } else {
                    this.pause();
                    this.emit('end');
                }
            })
            .on('end', function() {
                this.end();
                this.emit('close');
            })
            .on('close', function() {
                console.log('[End Recording. file=' + filename + ', duration=' + duration + ']');
                if (ext != '') {
                    // remove extention if it exists - makes it easier for logic to handle
                    fs.rename(path + filename + ext, path+ filename, callback);
                } else {
                    // otherwise just run the callback
                    callback();
                }
            })
    } else {
        // set up for ffmpeg, which will handle anything other than http
        ext = '.mp3';
        var command = 'ffmpeg';
        var args = [
            '-i',
            url,
            '-t',
            duration / 1000,
            path + filename + ext];
        stream = spawn(command, args);

        stream.on('error', function(err) {
            console.log('[ERROR. ' + err.message + ']');
        });

        // handle close event, shared between ffmpeg and request based recording
        stream.on('close', function() {
            console.log('[End Recording. file=' + filename + ', duration=' + duration + ']');
            if (ext != '') {
                // remove extention if it exists - makes it easier for logic to handle
                fs.rename(path + filename + ext, path+ filename, callback);
            } else {
                // otherwise just run the callback
                callback();
            }
        });
    }
}

/*
 * uncontain
 * If a stream url happens to be a container format such as
 * m3u or pls, the actual streaming url can be obtained by
 * requesting the original url and reading the contents
 */
function uncontain(element, callback) {
    var re_m3u = /.*(\.m3u)$/mi;
    var re_pls = /.*(\.pls)$/mi;

    var re_url = /file\d*=(.*)\n*$/mi;


    if (re_m3u.test(element)) {
        console.log('[Resolving m3u. url=' + element + ']');
        request(element, function(err, res, body) {
            if (!err && res.statusCode == 200) {
                // the request body is just the streaming url
                var body = String(body).replace(/(\r\n|\n|\r)/gm, '');
                console.log('[Found. url=' + body + ']');
                callback(null, body);
            } else {
                console.log('[ERROR. ' + err + ']');
            }
        });
    } else if (re_pls.test(element)) {
        console.log('[Resolving pls. url=' + element + ']');
        request(element, function(err, res, body) {
            if (!err && res.statusCode == 200) {
                // dig around for the url
                var body = String(body);
                var match = re_url.exec(body);
                if (match != null) {
                    console.log('[Found. url=' + match[1] + ']');
                    callback(null, match[1]);
                } else {
                    console.log('[ERROR. Could not extract url from file]');
                }
            } else {
                console.log('[ERROR. ' + err + ']');
            }
        });
    }
}

// export the class
module.exports = Recorder;
