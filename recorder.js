var fs = require('fs');
var moment = require('moment');
var uuid = require('node-uuid');
var request = require('request');
// provide an interface to record streams from.

/*
 * constructor
 */
function Recorder(streams, startTime, duration, description) {
    this.streams = streams;
    this.startTime = startTime;
    this.duration = Number(duration);
}

// print streams to terminal
Recorder.prototype.printStreams = function() {
    console.log(this.streams);
}

// print duration to terminal
Recorder.prototype.printDuration = function() {
    console.log(this.duration);
}

//print startTime to terminal
Recorder.prototype.printStartTime = function() {
    console.log(this.startTime);
}

// activate a stream
Recorder.prototype.activate = function() {
    // scheduling
    var now = moment();
    var start = moment(this.startTime, 'DD/MM/YYYY HH:mm');
    var wait = moment.duration(start.valueOf() - now.valueOf());
    // recording
    var duration = moment.duration(this.duration, 'minutes').valueOf();
    var streams = this.streams;

    // timer expires when recording should start
    var id = setTimeout(function() {
        record(duration, streams);
    }, wait.valueOf());
}

/*
 * record information from a stream
 */
function record(duration, streams) {

    var filename = uuid.v4();
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
            fs.appendFile(filename, chunk, function(err) {
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

    stream.on('close', function() {
        console.log('stream was closed');
    });

    stream.on('error', function() {
        console.log('There was an error with the stream');
    });



}

// export the class
module.exports = Recorder;
