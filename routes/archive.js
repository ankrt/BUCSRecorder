var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var router = express.Router();

/*
 * GET recordings
 */
router.get('/', function(req, res) {
    res.render('archive', {title : 'Archive'})
});

/*
 * GET all recordings from archive
 */
router.get('/recordings', function(req, res) {
    var db = req.db;
    db.collection('archive').find().sort({_id: -1}).toArray(function(err, items) {
        res.json(items);
    });
});

/*
 * GET file and send so user can download
 */
router.get('/recordings/download/:id.mp3', function(req, res) {
    var db = req.db;
    var id = req.params.id;
    console.log(id);

    var gs = db.gridStore(ObjectID(id), 'r');
    gs.read(function(err, data) {
        gs.close(function() {
            res.send(data);
        });
    });
});

/*
 * POST search term, reply with results
 * TODO: Make the search more advanced
 *  - Search through tags
 *  - Order by options: date, duration
 *  - Filtering options: date, duration, station, tags
 */
router.post('/search', function(req, res) {
    db = req.db;
    var re = new RegExp('.*' + req.body.searchTerm + '.*', 'gi');

    db.collection('archive').find({description: re}).sort({_id: -1}).toArray(function(err, items) {
        res.json(items);
    });
});

module.exports = router;
