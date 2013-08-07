//<summary>Displays a highly noticable message at the top of the page
//         to inform the user that their browsing experience may suffer for their
//         choice of browser. Only include the script when the browser message should be shown.
// </summary>
$(document).ready(function(){
    var msg = '<div id="pdp-browser-warning">' + 
                'Your Internet browser may not work correctly with all functionality on this website.  Please consider upgrading to a more recent version.' + 
               '</div>';
    $('body').prepend(msg);

});
