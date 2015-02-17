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
    var ranges = desiredRanges(req.headers);

    // Ridiculous hack to get around Safari's
    // absurd request range system
    if (ranges.start === ranges.end) {
        res.sendStatus(416);
        return;
    }

    var gs = db.gridStore(ObjectID(id), 'r');

    // seek to desired point of file
    gs.seek(ranges.start, function(err) {
        // read the following len bytes from file
        if (ranges.end === null || ranges.end > gs._native.length) {
            ranges.end = gs._native.length;
        }
        var len = ranges.end - ranges.start;

        gs.read(len, function(err, data) {
            gs.close(function() {
                var headers = {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': String(len),
                    'Content-Range': 'bytes ' + String(ranges.start) + '-' + String(ranges.end) + '/' + String(gs._native.length),
                    'Accept-Ranges': 'byte'
                };
                // Set the status code to:
                //  - 206 if data is partial
                //  - 200 if the full data is sent
                var stat = len < gs._native.length ? 206 : 200;
                res.status(stat).set(headers).send(data);
            });
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

desiredRanges = function(header) {
    var re = /bytes=(\d+)-(\d*)/;
    var ranges = {
        start: 0,
        end: null
    };

    if (header.range != undefined) {
        var result = re.exec(header.range);
        ranges.start = parseInt(result[1]);
        ranges.end = result[2] === '' ? null : parseInt(result[2]);
        return ranges;
    } else {
        return ranges;
    }
}

module.exports = router;
