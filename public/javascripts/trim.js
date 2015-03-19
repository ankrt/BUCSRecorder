var timeline = $('.timeline');
var Lslider = $('.Lslider');
var Rslider = $('.Rslider');
var LtrimZone = $('.Ltrim-zone');
var RtrimZone = $('.Rtrim-zone');
var audio = $('audio')[0];
var totalDuration = 0;
var trimStartTime = 0;
var trimEndTime = 0;

// store the percentage that the play tracker should move to
// when mouseup event occurs. Cannot use positions of sliders
// because they are relative to the left/right of the timeline
var audioStart_pcnt = 0;
// store the maximum percentage the audio should be allowed to reach
// updated by moving the right slider
var audioEnd_pcnt = 100;

var Lactive = false;
var Ractive = false;

/*
 * When the metadata has loaded, update the totalDuration of the track
 */
$('audio').on('loadedmetadata', function() {
    console.log($(this)[0].duration);
    totalDuration = $(this)[0].duration;
    trimEndTime = totalDuration;
    updateEndTime();
    updateTotalDuraton();
});

/*
 * Media Controls
 */
$('button.play-pause-toggle').on('click', function() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});
$('button.reset').on('click', function() {
    audio.pause();
    changeCurrentTime(audioStart_pcnt);
});
$('button.volume-down').on('click', function() {
    // decrement the volume
    if (audio.volume > 0.1) {
        audio.volume -= 0.1;
    }
    // at min volume
    if (audio.volume < 0.05) {
        // disable vol up
        $(this).addClass('disabled');
    }
    // nolonger at max volume
    if (audio.volume < 0.95) {
        // enable volume down
        $(this).next().removeClass('disabled');
    }
});
$('button.volume-up').on('click', function() {
    if (audio.volume < 1) {
        audio.volume += 0.10;
    }
    // at max volume
    if (audio.volume > 0.9) {
        // disable vol up
        $(this).addClass('disabled');
    }
    // nolonger at min volume
    if (audio.volume > 0.05) {
        // enable volume down
        $(this).prev().removeClass('disabled');
    }
});

/*
 * Clicking on the timeline should move the play-tracker that
 * point in the audio. Only areas within the bounds of the sliders
 * should cause a response
 */
$('.timeline').on('click', function(event) {
    var me = $(this);
    var posLSlider_pcnt = ((Lslider.offset().left - timeline.offset().left + Lslider.width()) / timeline.width()) * 100;
    var posRSlider_pcnt = ((Rslider.offset().left - timeline.offset().left) / timeline.width()) * 100;
    var posClickPoint_pcnt = ((event.pageX - me.offset().left) / me.width()) * 100;

    // check if point is within the sliders
    if (posClickPoint_pcnt > posLSlider_pcnt + 1 && posClickPoint_pcnt < posRSlider_pcnt - 1) {
        changeCurrentTime(posClickPoint_pcnt);
    }

});

/*
 * Advance the play tracker on timeupdate events
 */
$('audio').on('timeupdate', function(event) {
    // calculate the current time as a percentage of track length
    var currentTime_pcnt = (audio.currentTime / audio.duration) * 100;
    // move the play tracker to the position that is this percentage along the timeline
    $('.play-tracker').css('left', currentTime_pcnt + '%');
    $('.current-time-counter').html('<h5>' + toMinutes(audio.currentTime) + '</h5>');
    // pause the audio if it has gone beyond the right slider and reset
    if (currentTime_pcnt > audioEnd_pcnt) {
        audio.pause();
        changeCurrentTime(audioStart_pcnt);
    }
});

/*
 * Change glyphicon of play/pause button to reflect whether or not the audio
 * actually playing
 */
$('audio').on('playing', function(event) {
    var target = $('button.play-pause-toggle');
    target.children('span').removeClass('glyphicon-play');
    target.children('span').addClass('glyphicon-pause');
});
$('audio').on('pause', function(event) {
    var target = $('button.play-pause-toggle');
    target.children('span').removeClass('glyphicon-pause');
    target.children('span').addClass('glyphicon-play');
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
        changeCurrentTime(audioStart_pcnt);
        $(window).off('mousemove', moveLeftSlider);
    }
    if (Ractive) {
        moveRightSlider(event);
        changeCurrentTime(audioStart_pcnt);
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
    } else if (newPosLeft_pcnt < 0) {
        fixedPosLeft_pcnt = 100;
        Lslider.css('right', fixedPosLeft_pcnt + '%');
    }
    if (newPosLeft_pcnt > posOtherSlider_pcnt) {
        fixedPosLeft_pcnt = 100 - posOtherSlider_pcnt;
        Lslider.css('right', fixedPosLeft_pcnt + '%');
    }

    // change the width of the Ltrim-zone so it
    // fills from the left up to the Lslider
    var trimZoneWidth = 100 - fixedPosLeft_pcnt;
    LtrimZone.css('width', trimZoneWidth + '%');

    // change the currentTime of the audio so that the play tracker
    // moves to the new position of the slider, this is the same as the
    // trimZoneWidth
    audioStart_pcnt = trimZoneWidth;

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

    // change the width of the Ltrim-zone so it
    // fills from the left up to the Lslider
    var trimZoneWidth = 100 - fixedPosRight_pcnt;
    RtrimZone.css('width', trimZoneWidth + '%');

    // change the max percentage the track should reach when playing
    audioEnd_pcnt = fixedPosRight_pcnt;

    // update the start/end times of the audio
    trimEndTime = (fixedPosRight_pcnt / 100) * totalDuration;
    updateEndTime();
}

function updateStartTime() {
    $('.trim-start-time').html('Trim Start: ' + toMinutes(trimStartTime));
    updateTrimDuration();
}

function updateEndTime() {
    $('.trim-end-time').html('Trim End: ' + toMinutes(trimEndTime));
    updateTrimDuration();
}

function updateTrimDuration() {
    $('.trim-duration').html('Trim Duration: ' + toMinutes(trimEndTime - trimStartTime));
}

function updateTotalDuraton() {
    $('.total-duration').html('Total Duration: ' + toMinutes(totalDuration));
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

function changeCurrentTime(percentage) {
    if (audio.playing) {
        audio.pause();
    }
    var test = audio.duration * (percentage / 100);
    console.log(audio.duration);
    audio.currentTime = test;
}

function toMinutes(n) {
    var totalSeconds = parseInt(Math.round(n));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return ('00' + minutes).slice(-2) + ':' + ('00' + seconds).slice(-2);
}
