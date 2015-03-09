
$(document).ready(function() {
    $.ajax({
        type: 'GET',
        url: '/upcoming',
        dataType: 'HTML'
    }).done(function(res) {
        if (res.msg === '') {
            console.log('There was no response');
            // something
        } else {
            $('#upcoming-recordings').append(res);
        }
    });
});
