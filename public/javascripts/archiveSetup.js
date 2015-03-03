
// On page load, fetch recordings and render page
$(document).ready(function() {
    $.ajax({
        type: 'GET',
        url: '/archive/recordings',
        dataType: 'HTML'
    }).done(function(res) {
        if (res.msg === '') {
            // something
        } else {
            $('#recording-list').empty();
            $('#recording-list').append(res);
        }
        rec.resizeProgressBar();
    });
});

// On window resize adjust the width of the progress bar
$(window).on('resize', function() {
    rec.resizeProgressBar();
});

// search database on text entry into the search box
// TODO: Refactor this into its own function
$('#search-box').on('input', function(e) {
    var query = {
        'searchTerm': $(this).val()
    };

    $.ajax({
        type: 'POST',
        data: query,
        url: '/archive/search',
        dataType: 'JSON'
    }).done(function(res) {
        if (res.msg === '') {
            // something
        } else {
            $('#recording-list').empty();
            $('#recording-list').append(res);
        }
        rec.resizeProgressBar();
    });
});

// play/pause audio on button presses
// TODO: Refactor this into its own function
$('body').on('click', 'button.play-pause-toggle', function() {
    var me = $(this); // only used within callbacks
    var audio = $(this).parent().siblings('audio')[0];
    var paused = audio.paused;
    var oldState = !paused ? 'glyphicon-pause' : 'glyphicon-play';
    var newState = paused ? 'glyphicon-pause' : 'glyphicon-play';

    $(this).children('span').removeClass(oldState);
    $(this).children('span').addClass(newState);

    if (paused) {
        audio.play();
        interval = window.setInterval(function() {
            progress_seconds = Math.ceil(audio.currentTime);
            progress_percent = Math.ceil(audio.currentTime / audio.duration * 100);
            $(me).parent().next().find('.progress-bar').attr('style', 'width: ' + progress_percent + '%');
        }, 1000);
    } else {
        audio.pause();
        window.clearInterval(interval);
    }

});

// turn the volume down
$('body').on('click', 'button.volume-down', function() {
    var audio = $(this).parent().siblings('audio')[0];
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

// turn the volume up
$('body').on('click', 'button.volume-up', function() {
    var audio = $(this).parent().siblings('audio')[0];
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

// seek through the recording when progress bar is clicked
$('body').on('click', '.progress', function(event) {
    var me = $(this);
    var audio = $(this).parent().siblings('audio')[0];

    if (isNaN(audio.duration)) {
        return;
    }

    // compute where the user clicked
    var width = me.width();
    var offset = me.offset().left;
    var clickPercent = (event.pageX - offset) / width;

    // advance the progress bar to this point
    me.children('.progress-bar').attr('style', 'width: ' + Math.ceil(clickPercent * 100) + '%');
    // change the current position in the audio
    audio.currentTime = Math.ceil(audio.duration * clickPercent);
});


// FUNCTIONS

rec.resizeProgressBar = function() {
    var progWidth = $('#recording-list .well').width() - 20 - 118 - 79;
    $('#recording-list .progress').css('width', progWidth);
}

