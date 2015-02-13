
// DOM Ready
$(document).ready(function() {
    rec.loadRecordings();
});


// FUNCTIONS

rec.loadRecordings = function() {
    // recordings
    var recording;

    $.getJSON('/archive/recordings', rec.generateHTML)
}

rec.generateHTML = function(data) {
    $.each(data, function() {
        recording = $([
        "<div class='row'>",
            "<div class='panel panel-default'>",
                "<div class='panel-heading'>",
                    "<h4 class='panel-title'>" + this.description + "</h4>",
                "</div>",
                "<div class='panel-body'>",
                    "<div class='col-sm-6'>",
                        "<p>" + this.stationName + "</p>",
                        "<p>" + this.dateAdded + "</p>",
                        "<p>" + this.duration + " minutes</p>",
                        "<p>" + this.views + "</p>",
                    "</div>", // END COL 1
                    "<div class='col-sm-6'>",
                        "<div class='panel panel-default'>",
                            "<div class='panel-body'>",
                                "<audio preload='none' type='audio/mp3' src='/archive/recordings/download/" + this.file + ".mp3'>Browser playback not supported</audio>",
                                "<button type='button' class='btn btn-default'>",
                                    "<span class='glyphicon glyphicon-download-alt'/>",
                                "</button>",
                                "<button type='button' class='btn btn-default play-pause-toggle'>",
                                    "<span class='glyphicon glyphicon-play'/>",
                                "</button>",
                            "</div>",
                        "</div>",
                        "<p>" + this.tags + "</p>",
                        "<a href='/archive/recordings/download/" + this.file + ".mp3'>Download</a>",
                    "</div>", // END COL 2
                "</div>",
            "</div>",
        "</div>"
        ].join("\n"));

        $("#recording-list").append(recording);
    });
}


/*
 * search database on text entry into the search box
 */
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
            var recording = '';
            rec.generateHTML(res);
            //window.alert(JSON.stringify(res));
        }
    });
});

/*
 * play/pause audio on button presses
 */
//$('button.play-pause-toggle').click(function() {
$('body').on('click', 'button.play-pause-toggle', function() {

    var playing = $(this).children().hasClass('glyphicon-pause');
    var oldState = playing ? 'glyphicon-pause' : 'glyphicon-play';
    var newState = !playing ? 'glyphicon-pause' : 'glyphicon-play';

    $(this).children().removeClass(oldState);
    $(this).children().addClass(newState);
    var player = $(this).siblings('audio')[0];

    if (playing) {
        player.pause();
    } else {
        player.play();
    }
});
