var express = require('express');
var moment = require('moment');
var jade = require('jade');
var fs = require('fs');
var path = require('path');
var router = express.Router();

var upcomingRecording = jade.compileFile(__dirname + '/../views/upcomingRecording.jade', {cache: true});

/* This should be refactored away; it is used at least twice */
function interpolateUpcoming(element) {
    return upcomingRecording(element);
}

/*
 * GET home page
 */
router.get('/', function(req, res) {
    res.render('index', { title: 'Home' });
});

/*
 * GET upcoming recordings
 */
router.get('/upcoming', function(req, res) {
    // query database for upcoming recordings
    var db = req.db;
    var now = moment();

    // get schedule items sorted by date descending
    db.collection('schedule').find().sort({start: 1}).toArray(function(err, items) {
        // select only items with date that is in future
        var upcomingItems = [];
        for (i = items.length - 1; i >= 0; i--) {
            var start = moment(items[i].start, 'DD/MM/YYYY HH:mm');
            if (now.isBefore(start)) {
                upcomingItems.push(items[i]);
            } else {
                break;
            }
        }
        var html = upcomingItems.map(interpolateUpcoming);
        res.send(html.join('\n'));
    });

});

module.exports = router;
