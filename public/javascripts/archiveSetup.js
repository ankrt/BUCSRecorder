
// On page load, fetch recordings and render page
$(document).ready(function() {
    $('body').on('playing', 'audio', function() {
        alert('Audio is playing');
    });
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
$(window).on('resize', rec.resizeProgressBar);

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
    var audio = $(this).siblings('audio')[0];
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
    var audio = $(this).siblings('audio')[0];
    if (audio.volume > 0.1) {
        audio.volume -= 0.1;
        console.log(audio.volume);
    }
});

// turn the volume up
$('body').on('click', 'button.volume-up', function() {
    var audio = $(this).siblings('audio')[0];
    if (audio.volume < 1) {
        audio.volume += 0.10;
        console.log(audio.volume);
    }
});

// seek through the recording
$('body').on('click', '.progress', function(event) {
    var me = $(this);
    var audio = $(this).parent().prev().find('audio');

    // compute where the user clicked
    var width = me.width();
    var offset = me.offset().left;
    var clickPercent = (event.pageX - offset) / width;

    // advance the progress bar to this point
    me.children('.progress-bar').attr('style', 'width: ' + Math.ceil(clickPercent * 100) + '%');
    // change the current position in the audio
    console.log('Seeking to: ' + Math.ceil(audio[0].duration * clickPercent));
    console.log('Time before seek: ' + audio[0].currentTime);
    audio[0].currentTime = Math.ceil(audio[0].duration * clickPercent);
    console.log('Time after seek: ' + audio[0].currentTime);
    //alert(Math.ceil(audio[0].duration * clickPercent));
});


// update progress bar based on audio timeupdate events

// FUNCTIONS

rec.resizeProgressBar = function() {
    var progWidth = $('#recording-list .well').width() - 20 - 118 - 42;
    $('#recording-list .progress').css('width', progWidth);
}

