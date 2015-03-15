var fs = require('fs');
var moment = require('moment');
var uuid = require('node-uuid');
var spawn = require('child_process').spawn;
var request = require('request');
var sync_request = require('sync-request');

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
    var tmp = streams.map(uncontain);
    streams = tmp;

    // timer to start of recording
    setTimeout(function() {
        record(duration, streams, path, filename, callback);
    }, wait.valueOf());
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

    //if (re.test(url) == 0) {
    if (false) {
        stream = request(url);
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
    }

    stream.stderr.on('data', function(data) {
        console.log(String(data));
    });

    // handle data event, only used in request based recording
    stream.on('data', function(chunk) {
        console.log('received some data');
        var now = moment();
        elapsed = now.valueOf() - start.valueOf();

        if (elapsed < duration) {
            fs.appendFile(path + filename, chunk, function(err) {
                if (err) {
                    console.log('[ERROR. Could not write to file: ' + filename + ']');
                }
            });
        } else {
            stream.pause();
            stream.emit('end');
        }
    });

    // handle end event, only used in request based recording
    stream.on('end', function() {
        stream.end();
        stream.emit('close');
    });

    // handle errors, shared between ffmpeg and request based recording
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

/*
 * uncontain
 * If a stream url happens to be a container format such as
 * m3u or pls, the actual streaming url can be obtained by
 * requesting the original url and reading the contents
 */
function uncontain(element) {
    var re_m3u = /.*(\.m3u)$/i;
    var re_pls = /.*(\.pls)$/i;

    var re_url = /file\d*=(.*)\n*$/mi;

    var retval = element;

    if (re_m3u.test(element)) {
        var res = sync_request('GET', element);
        if (res.statusCode == 200) {
            // the request body is just the streaming url
            var body = String(res.getBody());
            retval = body;
        }
    } else if (re_pls.test(element)) {
        var res = sync_request('GET', element);
        if (res.statusCode == 200) {
            // dig around for the url
            var body = String(res.getBody());
            var match = re_url.exec(body);
            if (match != null) {
                retval = match[1];
            }
        }
    }
    return retval;
}

// export the class
module.exports = Recorder;
