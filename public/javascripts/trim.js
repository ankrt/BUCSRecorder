var timeline = $('.timeline');
var Lslider = $('.Lslider');
var Rslider = $('.Rslider');
var LtrimZone = $('.Ltrim-zone');
var RtrimZone = $('.Rtrim-zone');
var audio = $('audio')[0];
var totalDuration = 0;
var trimStartTime = 0;
var trimEndTime = 0;

var Lactive = false;
var Ractive = false;

/*
 * When the metadata has loaded, update the totalDuration of the track
 */
$('audio').on('loadedmetadata', function() {
    totalDuration = $(this)[0].duration;
    trimEndTime = totalDuration;
    updateEndTime();
    updateTotalDuraton();
});

/*
 * Toggle between play and pause icons in the
 * play/pause button
 */
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

/*
 * Advance the play tracker on timeupdate events
 */
$('audio').on('timeupdate', function(event) {

    // calculate the current time as a percentage of track length
    var currentTime_pcnt = (audio.currentTime / audio.duration) * 100;
    // move the play tracker to the position that is this percentage along the timeline
    $('.play-tracker').css('left', Math.round(currentTime_pcnt));

    //console.log(currentTime_pcnt);
});



/*
 * On mousedown event, the code listens for mouse movement
 * and moves the slider with the mouse
 * On mouseup, sliders must stop moving and listeners are removed
 */
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

    // calculate the offset of mouse relative to timeline, in percent
    var newPosLeft_pcnt = ((event.pageX - timeline.offset().left) / timeline.width()) * 100;
    var fixedPosLeft_pcnt = 0;
    // position of the other slider, in percent
    var posOtherSlider_pcnt = ((Rslider.offset().left - timeline.offset().left) / timeline.width()) * 100;

    // move the slider, but keep within allowable constraints
    if (newPosLeft_pcnt >= 0 && newPosLeft_pcnt <= 100) {
        fixedPosLeft_pcnt = 100 - newPosLeft_pcnt;
        Lslider.css('right', fixedPosLeft_pcnt + '%');
    }
    if (newPosLeft_pcnt < 0) {
        fixedPosLeft_pcnt = 100;
        Lslider.css('right', fixedPosLeft_pcnt + '%');
    }
    if (newPosLeft_pcnt > posOtherSlider_pcnt) {
        fixedPosLeft_pcnt = 100 - posOtherSlider_pcnt;
        Lslider.css('right', fixedPosLeft_pcnt + '%');
    }

    // finally, change the width of the Ltrim-zone so it
    // fills from the left up to the Lslider
    var trimZoneWidth = 100 - fixedPosLeft_pcnt;
    LtrimZone.css('width', trimZoneWidth + '%');

    // update the start/end times of the audio
    trimStartTime = ((100 - fixedPosLeft_pcnt) / 100) * totalDuration;
    updateStartTime();
}


function moveRightSlider(event) {

    // calculate offset of mouse relative to timeline, in percent
    var newPosLeft_pcnt = ((event.pageX - timeline.offset().left) / timeline.width()) * 100;
    var fixedPosRight_pcnt = 0;
    // position of the other slider, in percent
    var posOtherSlider_pcnt = ((Lslider.offset().left - timeline.offset().left + Lslider.width()) / timeline.width()) * 100;

    // move the slider, but keep within allowable constraints
    if (newPosLeft_pcnt >= 0 && newPosLeft_pcnt <= timeline.width()) {
        fixedPosRight_pcnt = newPosLeft_pcnt;
        Rslider.css('left', fixedPosRight_pcnt + '%');
    }
    if (newPosLeft_pcnt < posOtherSlider_pcnt) {
        fixedPosRight_pcnt = posOtherSlider_pcnt;
        Rslider.css('left', fixedPosRight_pcnt + '%');
    }
    if (newPosLeft_pcnt > 100) {
        fixedPosRight_pcnt = 100;
        Rslider.css('left', fixedPosRight_pcnt + '%');
    }

    // finally, change the width of the Ltrim-zone so it
    // fills from the left up to the Lslider
    var trimZoneWidth = 100 - fixedPosRight_pcnt;
    RtrimZone.css('width', trimZoneWidth + '%');

    // update the start/end times of the audio
    trimEndTime = (fixedPosRight_pcnt / 100) * totalDuration;
    updateEndTime();
}

function updateStartTime() {
    $('.trim-start-time').html('Trim Start: ' + Math.round(trimStartTime));
    updateTrimDuration();
}

function updateEndTime() {
    $('.trim-end-time').html('Trim End: ' + Math.round(trimEndTime));
    updateTrimDuration();
}

function updateTrimDuration() {
    $('.trim-duration').html('Trim Duration: ' + Math.round(trimEndTime - trimStartTime));
}

function updateTotalDuraton() {
    $('.total-duration').html('Total Duration: ' + Math.round(totalDuration));
}

function updateByteRange() {
    // total length of the file in bytes
    var bytes = $('audio').attr('data-bytes');
    // start and end, as fractions of the totalDuration
    var startFrac = trimStartTime / totalDuration;
    var endFrac = trimEndTime / totalDuration;

    var startBytes = Math.floor(startFrac * bytes);
    var endBytes = Math.floor(endFrac * bytes);

    var currentURL = $('a.download').attr('href');
    currentURL = currentURL.split('?')[0];
    $('a.download').attr('href', currentURL + '?startBytes=' + startBytes + '&endBytes=' + endBytes);
}
