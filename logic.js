var Recorder = require('./recorder');
var moment = require('moment');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/recorder", {native_parser:true});

// constructor
function Logic() {
}



start();

function start() {
    db.collection('schedule', function(err, collection) {

        var cursorOptions = {
            tailable: true,
            awaitdata: true,
            numberOfRetries: -1
        };
        console.log(cursorOptions);

        var stream = collection.find({}, cursorOptions).sort( {$natural: 1} ).stream();

        stream.on('data', function(doc) {
            activateSchedule(doc);
        });
    });
}

function activateSchedule(sch) {
    if (isExpired(sch)) {
        console.log('Schedule with ID: ' + sch._id + ' has expired and will not be activated');
    } else {
        console.log('Schedule with ID: ' + sch._id + ' will be made active');
        // get the station information
        var station = sch.station;
        var duration = sch.duration;
        var startTime = sch.start;
        db.collection('stations').findById(station, function(err, item) {
            var streams = item.streams;
            var rec = new Recorder(streams, startTime, duration);
            rec.activate();
        });
    }
}

function isExpired(sch) {
    var now = moment();
    var start = moment(sch.start,'DD/MM/YYYY HH:mm');
    var diff = start - now;
    if (diff < 0) {
        return true;
    } else {
        return false;
    }
}

/*
 * Inform the instance of Logic that there is a new schedule
 */
Logic.prototype.notify = function() {
}

module.exports = Logic;
