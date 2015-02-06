
// DOM Ready
$(document).ready(function() {
    rec.loadRecordings();
});


// FUNCTIONS

rec.loadRecordings = function() {
    // recordings
    var recording = '';

    $.getJSON('/archive/recordings', function(data) {
        $.each(data, function() {
            // There must be a better way than this!
            recording = '<div class="row">';
            recording += '<div class="panel panel-default">';
            recording += '<div class="panel-heading">';
            recording += '<h4 class="panel-title">' + this.description + '</h4>';
            recording += '</div>'; // panel-heading
            recording += '<div class="panel-body">';
            recording += '<div class="col-sm-6">';
            recording += '<p>' + this.stationName + '</p>';
            recording += '<p>' + this.dateAdded + '</p>';
            recording += '<p>' + this.duration + ' minutes</p>';
            recording += '<p>' + this.views + '</p>';
            recording += '</div>'; // col-sm-6
            recording += '<div class="col-sm-6">';
            recording += '<p>' + this.tags + '</p>';
            // Change this to support other filetypes
            recording += '<a href="/archive/recordings/download/' + this.file + '.mp3">Download</a>';
            recording += '</div>'; // col-sm-6
            recording += '</div>'; // panel-body
            recording += '</div>'; // panel panel-default
            recording += '</div>'; // row

            $(".container-fluid#recording-list").append(recording);

        });
    });
}
