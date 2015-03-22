var selectableDurations = [1, 10, 20, 30, 60, 90, 120, 180, 240, 300, 360];

// DOM Ready
//$(document).ready(function() {
$(window).on('load', function() {
    rec.initForm();
});


// FUNCTIONS

rec.initForm = function() {
    // stations
    var stationOptions = '';

    $.getJSON('/schedule/stationList', function(data) {
        $.each(data, function() {
            stationOptions += '<option value="' + this._id + '">' + this.name + '</option>';
        });
        $(".station").children("select").append(stationOptions);
    });

    // durations
    durationOptions = '';

    for (var i = 0; i < selectableDurations.length; i++) {
        durationOptions += '<option>' + selectableDurations[i] + '</option>';
    }
    $(".duration").children("select").append(durationOptions);

    var $selector = $(".datetime").children(".input-group.date");
    $selector.datetimepicker({
        format: 'DD/MM/YYYY HH:mm',
        minDate: moment(),
        maxDate: moment().add(21, 'days')
    });
}

// remove a form when the remove button is clicked
$("body").on('click', ".remove-button", function() {
    $(this).closest(".form").remove();
});

$("button#submit").on('click', function(e) {
    e.preventDefault();

    // no error checking just yet.

    // bring form fields into one object
    var newSchedule = {
        'station' : $('.form-group.station select').val(),
        'stationName' : $('.form-group.station select option:selected').html(),
        'start' : $('.form-group.datetime input').val(),
        'duration' : $('.form-group.duration select').val(),
        'description' : $('.form-group.description input').val(),
        'usedForTeaching' : $('.checkbox input').is(':checked')
    }

    if (newSchedule.start === '') {
        window.alert('Please enter a Start time');
    } else if (newSchedule.description === '') {
        window.alert('Please enter a Title');
    } else {
        // use AJAX to post this to the addschedule service.

        $.ajax({
            type: 'POST',
            data: newSchedule,
            url: '/schedule/submit',
            dataType: 'JSON'
        }).done(function(res) {
            // check for success (blank response)
            if (res.msg === '') {
                // redirect to home page, where user can view upcoming recordings
                $(location).attr('href', '/');
            } else {
                window.alert('Something went wrong: ' + res.msg);
            }
        });
    }

});
