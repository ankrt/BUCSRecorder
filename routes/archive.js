var express = require('express');
var router = express.Router();

/*
 * GET recordings
 */
router.get('/', function(req, res) {
    res.render('archive', {title : 'Archive'})
});

module.exports = router;