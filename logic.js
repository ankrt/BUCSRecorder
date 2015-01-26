var Recorder = require('./recorder');
var fs = require('fs');
var moment = require('moment');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/recorder", {native_parser:true});
var probe = require('node-ffprobe');

// constructor
function Logic() {
}

start();

function start() {

    // start tailable cursor on schedule collection
    db.collection('schedule', function(err, collection) {

        var cursorOptions = {
            tailable: true,
            awaitdata: true,
            numberOfRetries: -1
        };

        var stream = collection.find({}, cursorOptions).sort( {$natural: 1} ).stream();

        stream.on('data', function(schedule) {
            activate(schedule);
        });
    });
}

function activate(schedule) {
    if (!expired(schedule)) {
        console.log('Schedule with ID: ' + schedule._id + ' will be made active');

        db.collection('stations').findById(schedule.station, function(err, station) {
            var rec = new Recorder(station, schedule);
            rec.activate(function() {
                updateDatabase(rec.recording);
            });
        });
    }
}

/*
 * Check whether a schedule is expired
 */
function expired(schedule) {
    var now = moment();
    var start = moment(schedule.start,'DD/MM/YYYY HH:mm');
    var diff = start - now;
    if (diff < 0) {
        return true;
    } else {
        return false;
    }
}

/*
 * Write the recording into the database
 */
function updateDatabase(recording) {

    var track = recording.filename;

    probe(track, function getExtention(err, probeData) {
        extention = probeData.format.format_name;
        trackName = track + '.' + extention;
        fs.rename(track, trackName, function write(err) {
            console.log('File was renamed successfully');
        });
    });
}


module.exports = Logic;
