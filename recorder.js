var fs = require('fs');
var moment = require('moment');
var uuid = require('node-uuid');
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
    console.log(this.recording.filename);
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

    var start = moment(); // time when recording was started
    var elapsed = 0; // elapsed time in ms since start of recording
    var s = streams[0]; // must work out how to utilise all streams

    console.log('recording from %s for duration of %d ms', s, duration);

    var stream = request(s);

    // handle data events
    stream.on('data', function(chunk) {
        var now = moment();
        elapsed = now.valueOf() - start.valueOf();

        if (elapsed < duration) {
            fs.appendFile(path + filename, chunk, function(err) {
                if (err) {
                    console.log('There was an error writing t othe file');
                }
            });
        } else {
            stream.pause();
            stream.emit('end');
        }
    });

    // handle end event
    stream.on('end', function() {
        stream.end();
        stream.emit('close');
    });

    // close stream and write file to database
    stream.on('close', callback);

    stream.on('error', function() {
        console.log('There was an error with the stream');
    });
}


// export the class
module.exports = Recorder;
