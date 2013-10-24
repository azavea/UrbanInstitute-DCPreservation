$("#navbar-toggle").click(function() {
	$("#left").toggleClass('visible');
	$("#center").toggleClass('visible');
	$("#navbar-toggle").toggleClass('visible');
})







$(".on, .off").bind('click',function() {
    $(this).toggleClass('on off');
    alert('Hello World');
})





width: 100%;
display: block;
text-align: right;
font-size: 11px;