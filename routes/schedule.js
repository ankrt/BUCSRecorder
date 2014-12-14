var express = require('express');
var router = express.Router();

/*
 * GET schedule
 */
router.get('/', function(req, res) {
    res.render('schedule', {title : 'Schedule'});
});

module.exports = router;