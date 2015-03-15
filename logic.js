var Recorder = require('./recorder');
var async = require('async');
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

    async.waterfall([
        function checkFileExists(callback) {
            fs.exists(path + filename, function(exists) {
                if (exists) {
                    console.log('[File exists. name=' + path + filename + ' was created by recording process]');
                    callback(null);
                } else {
                    console.log('[ERROR. File was not created and can not be archived]');
                    callback('ERROR');
                }
            });
        },
        function probeFileForMetadata(callback) {
            probe(path + filename, function getExtention(err, probeData) {
                if (!err) {
                    // get file format and add extention
                    var extention = probeData.format.format_name;
                    console.log('[File Extention. name=' + extention + ' was found by probing the file]');
                    callback(null, extention);
                } else {
                    console.log('[ERROR. File could not be probed]');
                    callback('ERROR');
                }
            });
        },
        function renameWithExtention(extention, callback) {
            fs.rename(path + filename, path + filename + '.' + extention, function write(err) {
                if (!err) {
                    filename = filename + '.' + extention;
                    console.log('[File Renamed. name=' + filename + ' is the new name]');
                    callback(null, filename);
                } else {
                    console.log('[ERROR. File could not be renamed]');
                    callback('ERROR');
                }
            });
        },
        function openGridStore(filename, callback) {
            gs = db.gridStore(fileID, filename, 'w');
            gs.open(function(err, gs) {
                if (!err) {
                    console.log('[GridStore Opened.]');
                    callback(null, filename, gs);
                } else {
                    console.log('[ERROR. GridStore could not be opened]');
                    callback('ERROR');
                }
            });
        },
        function writeFileToGridStore(filename, gs, callback) {
            gs.writeFile(path + filename, function(err, gs) {
                if (!err) {
                    console.log('[GridStore File Written.]');
                    callback(null, filename, gs);
                } else {
                    console.log('[ERROR. File could not be written to GridStore]');
                    callback('ERROR');
                }
            });
        },
        function closeGridStore(filename, gs, callback) {
            gs.close(function() {
                console.log('[GridStore Closed.]');
                callback(null, filename);
            });
        },
        function updateArchive(filename, callback) {
            fs.unlink(path + filename);
            console.log('[Temp file deleted.]');

            var document = {
                file: fileID,
                duration: recording.duration,
                dateAdded: recording.date,
                stationName: recording.stationName,
                views: 0,
                description: recording.description,
                tags: []
            };

            db.collection('archive').insert(document, function(err, record) {
                if (!err) {
                    callback(null, record[0]._id);
                } else {
                    console.log('[ERROR. Archive item not added]');
                    callback('ERROR');
                }
            });
        }
    ], function(err, result) {
        console.log('[File Archived. id=' + result + ']');
    });
}


module.exports = Logic;
