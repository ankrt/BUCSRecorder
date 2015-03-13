var fs = require('fs');
var moment = require('moment');
var uuid = require('node-uuid');
var spawn = require('child_process').spawn;
var request = require('request');

// constructor
//function Recorder(streams, startTime, duration, description) {
function Recorder(station, schedule) {
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
    //console.log(this.recording.filename);
    // scheduling
    var now = moment();
    var start = moment(this.recording.date, 'DD/MM/YYYY HH:mm');
    var wait = moment.duration(start.valueOf() - now.valueOf());
    // recording
    var duration = moment.duration(this.recording.duration, 'minutes').valueOf();
    var filename = this.recording.filename;
    var path = this.recording.path;
    var streams = this.streams;

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

    console.log('[Begin Recording. file=' + filename + ', duration=' + duration + ']');

    // set up for ffmpeg
    if (url.search(re) == 0) {
        stream = request(url);
    } else {
        ext = '.mp3';
        var command = 'ffmpeg';
        var args = [
            '-i',
            url,
            '-t',
            duration / 1000,
            path + filename];
        stream = spawn(command, args);
    }

    // handle data event, only used in request based recording
    stream.on('data', function(chunk) {
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
            fs.rename(pah + filename + ext, path+ filename, callback);
        } else {
            // otherwise just run the callback
            callback();
        }
    });
}


// export the class
module.exports = Recorder;
