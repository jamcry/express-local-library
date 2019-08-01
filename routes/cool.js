var express = require('express');
var router = express.Router();

router.get('/cool', function(req, res, next) {
  res.render('cool', { title: 'Coolest page' });
});

module.exports = router;