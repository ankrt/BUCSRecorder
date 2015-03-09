var rowNum = 0;

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

    for (i = 1; i < 61; i++) {
        durationOptions += '<option>' + i + '</option>';
    }
    $(".duration").children("select").append(durationOptions);

    var $selector = $(".datetime").children(".input-group.date");
    $selector.datetimepicker({
        format: 'DD/MM/YYYY HH:mm',
        minDate: moment(),
        maxDate: moment().add(21, 'days')
    });
}

// add a form to the page
rec.addForm = function() {
    rowNum++;
    var $form = $(".form", "#form-list").last();
    var nextForm = $form.clone();
    nextForm.attr("id", "form-" + rowNum);

    var hasRemoveButton = $(".remove-button", nextForm).length > 0;
    if (!hasRemoveButton) {
        var rmb = '<button type="button" class="remove-button btn btn-default pull-right">Remove</button>';
        $(".form-actions", nextForm).append(rmb);
    }
    $form.after(nextForm);

    //// this is duplicate code, should be refactored out
    //var $datetimeSelector = $(".datetime", nextForm).children(".input-group.date");
    //$datetimeSelector.datetimepicker();
    //$datetimeSelector.data('DateTimePicker').setMinDate(moment());
    //$datetimeSelector.data('DateTimePicker').setMaxDate(moment().add(21, 'days'));
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
        'description' : $('.form-group.description input').val()
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
                // clear input fields
                $('.form-group input').val('');
            } else {
                window.alert('Something went wrong: ' + res.msg);
            }
        });
    }

});
