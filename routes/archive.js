var express = require('express');
var jade = require('jade');
var ObjectID = require('mongodb').ObjectID;
var router = express.Router();

var archiveItem = jade.compileFile('views/archiveItem.jade', {cache: true});
//var archiveItem = jade.compileFile('views/archiveItem.jade');
/*
 * render the data into html
 */
interpolate = function(element) {
    return archiveItem(element);
}


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
        var html = items.map(interpolate);
        res.send(html.join('\n'));
    });
});

/*
 * GET file so it can be streamed to user
 */
router.get('/recordings/stream/:id.mp3', function(req, res) {
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
 * GET file so it can be downloaded by user
 * this is fundamentally the same as the 'stream' version
 * however, the content disposition flag is set in the response
 * so as to cause a file download
 */
router.get('/recordings/download/:id.mp3?', function(req, res) {
    var db = req.db;
    var id = req.params.id;
    var ranges = {};// = desiredRanges(req.headers);
    // get byte range from headers unless explicitly defined
    // in the url
    console.log(req.query.startBytes);
    console.log(req.query.endBytes);

    if(req.query.startBytes != undefined && req.query.endBytes != undefined) {
        ranges = {
            start: parseInt(req.query.startBytes),
            end: parseInt(req.query.endBytes)
        }
    } else {
        ranges = desiredRanges(req.headers);
    }

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
                    'Content-Disposition': 'attachment',
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
        var html = items.map(interpolate);
        //console.log(res.req);
        res.json(html);
        //res.type('html').send(html.join('\n'));
    });
});

/*
 * GET trimmer page,
 * where users will be able to trim the start
 * and end of a recording so the only download
 * the part that they need
 */
router.get('/trim/:id', function(req, res) {
    var db = req.db;
    var id = req.params.id;
    var len = 0;

    // Get the size of the file in bytes...
    // can use this to work out which byte ranges to download
    var gs = db.gridStore(ObjectID(id), 'r');
    gs.open(function() {
        len = gs._native.length;
        gs.close(function() {
            res.render('trim', {title : 'Trimmer', 'file' : id, 'bytes' : len})
        });
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
