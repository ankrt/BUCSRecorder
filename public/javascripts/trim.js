var timeline = $('.timeline');
var Lslider = $('.Lslider');
var Rslider = $('.Rslider');
var audio = $('audio')[0];
var duration = 0;
var startTime = 0;
var endTime = 0;

var Lactive = false;
var Ractive = false;

// When the metadata has loaded, update the duration of the track
$('audio').on('loadedmetadata', function() {
    duration = $(this)[0].duration;
    endTime = duration;
    updateEndTime();
});

$('button.play-pause-toggle').on('click', function() {
    var me = $(this); // only used within callbacks
    var paused = audio.paused;
    var oldState = !paused ? 'glyphicon-pause' : 'glyphicon-play';
    var newState = paused ? 'glyphicon-pause' : 'glyphicon-play';

    $(this).children('span').removeClass(oldState);
    $(this).children('span').addClass(newState);

    if (paused) {
        audio.play();
    } else {
        audio.pause();
    }
});


// do stuff when the sliders are moved
Lslider.on('mousedown', LmouseDown);
Rslider.on('mousedown', RmouseDown);
$(window).on('mouseup', mouseUp);

function LmouseDown() {
    Lactive = true;
    $(window).on('mousemove', moveLeftSlider);
}

function RmouseDown() {
    Ractive = true;
    $(window).on('mousemove', moveRightSlider);
}

function mouseUp(event) {
    if (Lactive) {
        moveLeftSlider(event);
        $(window).off('mousemove', moveLeftSlider);
    } else if (Ractive) {
        moveRightSlider(event);
        $(window).off('mousemove', moveRightSlider);
    }
    Lactive = false;
    Ractive = false;
    updateByteRange();
}


function moveLeftSlider(event) {

    // offset of mouse relative to timeline, in percent
    var newPosLeft = ((event.pageX - timeline.offset().left) / timeline.width()) * 100;
    var fixedPosLeft = 0;
    // position of the other slider, in percent
    var posOtherSlider = ((Rslider.offset().left - timeline.offset().left) / timeline.width()) * 100;

    // move the slider, but keep within allowable constraints
    if (newPosLeft >= 0 && newPosLeft <= timeline.width()) {
        fixedPosLeft = 100 - newPosLeft;
        Lslider.css('right', fixedPosLeft + '%');
    }
    if (newPosLeft < 0) {
        fixedPosLeft = 100;
        Lslider.css('right', fixedPosLeft + '%');
    }
    if (newPosLeft > posOtherSlider) {
        fixedPosLeft = 100 - posOtherSlider;
        Lslider.css('right', fixedPosLeft + '%');
    }

    // update the start/end times of the audio
    startTime = ((100 - fixedPosLeft) / 100) * duration;
    updateStartTime();
}


function moveRightSlider(event) {
    // offset of mouse relative to timeline, in percent
    var newPosLeft = ((event.pageX - timeline.offset().left) / timeline.width()) * 100;
    var fixedPosRight = 0;
    // position of the other slider, in percent
    var posOtherSlider = ((Lslider.offset().left - timeline.offset().left + Lslider.width()) / timeline.width()) * 100;

    // move the slider, but keep within allowable constraints
    if (newPosLeft >= 0 && newPosLeft <= timeline.width()) {
        fixedPosRight = newPosLeft;
        Rslider.css('left', fixedPosRight + '%');
    }
    if (newPosLeft < posOtherSlider) {
        fixedPosRight = posOtherSlider;
        Rslider.css('left', fixedPosRight + '%');
    }
    if (newPosLeft > 100) {
        fixedPosRight = 100;
        Rslider.css('left', fixedPosRight + '%');
    }

    // update the start/end times of the audio
    endTime = (fixedPosRight / 100) * duration;
    updateEndTime();
}

function updateStartTime() {
    $('.start-time').html('Start Time: ' + Math.round(startTime));
    updateTrimDuration();
}

function updateEndTime() {
    $('.end-time').html('End Time: ' + Math.round(endTime));
    updateTrimDuration();
}

function updateTrimDuration() {
    $('.trim-duration').html('Trim Duration: ' + Math.round(endTime - startTime));
}

function updateByteRange() {
    // total length of the file in bytes
    var bytes = $('audio').attr('data-bytes');
    // start and end, as fractions of the duration
    var startFrac = startTime / duration;
    var endFrac = endTime / duration;

    var startBytes = Math.floor(startFrac * bytes);
    var endBytes = Math.floor(endFrac * bytes);

    var currentURL = $('a.download').attr('href');
    currentURL = currentURL.split('?')[0];
    $('a.download').attr('href', currentURL + '?startBytes=' + startBytes + '&endBytes=' + endBytes);
}
