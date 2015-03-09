var Recorder = require('./recorder');
var fs = require('fs');
var moment = require('moment');
var mongo = require('mongoskin');
var ObjectID = require('mongodb').ObjectID;
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

        console.log('[Activate Schedule. id=' + schedule._id + ']');

        db.collection('stations').findById(schedule.station, function(err, station) {
            var rec = new Recorder(station, schedule);
            rec.activate(function() {
                archive(rec.recording);
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
 * Add the recording to the archive
 */
function archive(recording) {

    var path = recording.path;
    var filename = recording.filename;
    var fileID = new ObjectID();

    // WARNING: Callback Hell
    // probe file for metadata
    probe(path + filename, function getExtention(err, probeData) {
        //extention = probeData.format.format_name;
        // rename file to include appropriate extention
        //fs.rename(path + filename, path + filename + '.' + extention, function write(err) {
            //filename = filename + '.' + extention;
            // store file to gridFS collection in database
        gs = db.gridStore(fileID, filename, 'w');
        gs.open(function(err, gs) {
            gs.writeFile(path + filename, function(err, gs) {
                gs.close(function() {
                    // delete file from filesystem
                    fs.unlink(path + filename);
                    // File is stored, need to add information to Archive collection
                    var document = {
                        file: fileID,
                        duration: recording.duration,
                        dateAdded: recording.date,
                        stationName: recording.stationName,
                        views: 0,
                        description: recording.description,
                        tags: []};
                    db.collection('archive').insert(document, function(err, record) {
                        console.log('[File Archived. id=' + record[0]._id + ']');
                    });
                });
            });
        });
        //});
    });
}


module.exports = Logic;
