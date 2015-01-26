var express = require('express');
var router = express.Router();


/*
 * GET schedule
 */
router.get('/', function(req, res) {
    res.render('schedule', {title : 'Schedule'});
});

/*
 * GET all stations
 */
router.get('/stationList', function(req, res) {
    var db = req.db;
    db.collection('stations').find().toArray(function(err, items) {
        res.json(items);
    });
});

/*
 * POST submitted form data
 */
router.post('/submit', function(req, res) {
    var db = req.db;
    var logic = req.logic;
    db.collection('schedule').insert(req.body, function(err, result) {
        res.send((err === null) ? {msg: ''} : {msg: err});
    });
});

module.exports = router;
