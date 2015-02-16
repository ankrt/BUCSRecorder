
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
        //"<div class='row'>",
            "<div class='panel panel-default'>",
                "<div class='panel-heading'>",
                    "<h4 class='panel-title'>" + this.description + "</h4>",
                "</div>",
                "<div class='panel-body'>", // Pannel Body
                "<div class='row'>", // Row

                    // Column 1
                    "<div class='col-xs-12 col-sm-4'>",
                        "<p>" + this.stationName + "</p>",
                        "<p>" + this.dateAdded + "</p>",
                        "<p>" + this.duration + " minutes</p>",
                        "<p>" + this.views + "</p>",
                    "</div>",

                    // Column 2
                    "<div class='col-xs-12 col-sm-8'>",
                        "<div class='well'>",

                                // Audio control
                                "<div class='btn-toolbar' role='toolbar'>",
                                    "<div class='btn-group' role='group'>",
                                        "<audio preload='none' type='audio/mp3' src='/archive/recordings/download/" + this.file + ".mp3'>Browser playback not supported</audio>",
                                        // Play-Pause Toggle
                                        "<button type='button' class='btn btn-default play-pause-toggle'>",
                                            "<span class='glyphicon glyphicon-play'/>",
                                        "</button>",
                                        // Volume Down
                                        "<button type='button' class='btn btn-default vol-down'>",
                                            "<span class='glyphicon glyphicon-volume-down'/>",
                                        "</button>",
                                        // Volume Up
                                        "<button type='button' class='btn btn-default vol-up'>",
                                            "<span class='glyphicon glyphicon-volume-up'/>",
                                        "</button>",
                                    "</div>",

                                    // Progress bar
                                    "<div class='btn-group' role='group'>",
                                        "<div class='progress'>",
                                            "<div class='progress-bar' role='progressbar' aria-valuemin='0' aria-value-max='100' style='width: 0%;'>",
                                                "<span class='sr-only'>Track progress bar</span>",
                                            "</div>",
                                        "</div>",
                                    "</div>",

                                    // Download Button
                                    "<div class='btn-group pull-right' role='group'>",
                                        "<form method='get' action='/archive/recordings/download/" + this.file + ".mp3'>",
                                            "<button type='submit' class='btn btn-default'>",
                                                "<span class='glyphicon glyphicon-download-alt'/>",
                                            "</button>",
                                        "</form>",
                                    "</div>",

                                "</div>", // End btn-toolbar


                        "</div>", // End well

                    "</div>", // END Row
                "</div>", // END Panel Body
            "</div>"
        //"</div>"
        ].join("\n"));

        $("#recording-list").append(recording);

        var progWidth = $('#recording-list .well').width() - 20 - 118 - 42;
        $('#recording-list .progress').css('width', progWidth);
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
