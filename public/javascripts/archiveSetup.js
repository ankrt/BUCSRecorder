
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
                    "</div>",
                    "<div class='col-sm-6'>",
                        "<div class='panel panel-default'>",
                            "<div class='panel-body'>",
                                "<audio controls preload='none' type='audio/mp3' src='/archive/recordings/download/" + this.file + ".mp3'>Browser playback not supported</audio>",
                            "</div>",
                        "</div>",
                        "<p>" + this.tags + "</p>",
                        "<a href='/archive/recordings/download/" + this.file + ".mp3'>Download</a>",
                    "</div>",
                "</div>",
            "</div>",
        "</div>"
        ].join("\n"));

        $("#recording-list").append(recording);
    });
}


// search database on text entry into the search box
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
