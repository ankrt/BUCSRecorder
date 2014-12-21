rec.stationListData = [];
rec.cnt = -1;

// DOM Ready
$(document).ready(function() {
    rec.insertScheduleForm();
});

// FUNCTIONS

// insert form into page
rec.insertScheduleForm = function() {
    var formContent = '';
    rec.cnt++;

    formContent += '<div class="panel panel-default" id="panel_' + rec.cnt + '">';
        formContent += '<div class="panel-body">';
            formContent += '<form role="form" id="form_' + rec.cnt + '">';
                formContent += '<div class="col-sm-6">';
                    formContent += '<div class="form-group">';
                        formContent += '<label for="station">Station</label>';
                        formContent += '<select class="form-control" id="stationSelector_' + rec.cnt + '"></select>';
                        formContent += '<label for="date">Start Date/Time</label>';
                        formContent += '<div class="input-group date" id="datetime_' + rec.cnt + '">';
                            formContent += '<input type="text" class="form-control" data-date-format="DD/MM/YYYY HH:mm"/>';
                            formContent += '<span class="input-group-addon">';
                                formContent += '<span class="glyphicon-calendar glyphicon"></span>';
                            formContent += '</span>';
                        formContent += '</div>';
                        formContent += '<label for="recordDuration">Duration (minutes)</label>';
                        formContent += '<select class="form-control", id="durationSelector_' + rec.cnt + '"></select>';
                    formContent += '</div>';
                formContent += '</div>'; // end col 0
                formContent += '<div class="col-sm-6">';
                    formContent += '<div class="form-group">';
                        formContent += '<label for="description">Description</label>';
                        formContent += '<input type="text", class="form-control", id="descriptionInput_' + rec.cnt + '"></input>';
                        formContent += '<label for="actions">Actions</label>';
                        formContent += '<button type="submit" value="submit" class="btn btn-primary form-control" id="submitButton_' + rec.cnt + '" onclick="rec.addSchedule()">Submit</button>';
                        //formContent += '<button class="btn btn-default pull-right" id="removeButton" data-id="' + rec.cnt + '">Remove</button>';
                    formContent += '</div>';
                formContent += '</div>'; // end col 1
            formContent += '</form>';
        formContent += '</div>';
    formContent += '</div>';

    $(".row").append(formContent);
    rec.populateStationSelector(rec.cnt);
    rec.populateDurationSelector(rec.cnt);
    rec.initDatetimePicker(rec.cnt);
};

// populate station selector with stations
rec.populateStationSelector = function(num) {

    // content string
    var selectorContent = '';

    // jQuery AJAX call for JSON
    $.getJSON('/schedule/stationList', function(data) {

        // for each station add it as a dropdown item
        $.each(data, function() {
            selectorContent += '<option>' + this.name + '</option>';
        });

        // inject into dropdown html
        selector = '#stationSelector_' + num;
        $(selector).append(selectorContent);
    });
};

// populate duration with numbers
rec.populateDurationSelector = function(num) {

    var selectorContent = '';

    for (i = 1; i < 61; i++) {
        selectorContent += '<option>' + i + '</option>';
    }

    selector = '#durationSelector_' + num;
    $(selector).append(selectorContent);

};

// set up correct settings for datetime picker
rec.initDatetimePicker = function(num) {
    var $selector = $('#datetime_' + num);
    $selector.datetimepicker();
    $selector.data('DateTimePicker').setMinDate(moment());
    $selector.data('DateTimePicker').setMaxDate(moment().add(42, 'days'));
};

rec.addSchedule = function(num, event) {
    event.preventDefault();
    var form = '#form_' + num;

    // form validation
    var errCnt = 0;
    $(form + 'input').each(function(index, val) {
        if($(this).val() === '') {errCnt++;}
    });

    if (errCnt === 0) {
        var newSchedule = {
            'station' : $(form + 'select#stationSelector_' + num).val(),
            'start' : $(form + 'input#datetime_' + num).val(),
            'duration' : $(form + 'select#durationSelector_' + num).val(),
            'description' : $(form + 'input#descriptionInput_' + num).val()
        }

        $.ajax({
            type: 'POST',
            data: newSchedule,
            url: '/schedule/submit',
            dataType: 'JSON'
        }).done(function(res) {
            if (res.msg === '') {
                $(form + ' input').val('');
                //populate table?
            } else {
                alert('Error: ' + res.msg);
            }
        });
    } else {
        alert('Please fill in all fields');
        return false;
    }
};
