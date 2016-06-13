var now = "";
var nBoxes = 5;
var annotatedSpeakers = {};
var annotatedLabels = {};
var annotationResults = [];
var pResults = -1;
var nDisp = 2;
var startTime = -1;
var username = "name";

// quoted from http://dotnsf.blog.jp/archives/1012215593.html
if(window.history && window.history.pushState){
    console.log("hey");
    history.pushState("nohb", null, "");
    $(window).on("popstate", function(event){
	console.log("hey1");
	if(!event.originalEvent.state){
	    console.log("hey2");
	    history.pushState("nohb", null, "");
	    return;
	}
    });
}

$(document).on('pagecontainershow', function(event, ui){
    if(ui.toPage.is('#home')){
	$('#username-tab').trigger('click');
	console.log("tabs show!!");
    }
});

//pagebeforeshow
$(document).on('pagecontainerbeforeshow', function(event, ui){
    if(ui.toPage.is('#observation')){
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    var v = annotatedSpeakers[pn];
	    
	    if(v == undefined || v == ""){
		$("#bt_" + pn).prop("disabled", true);
	    } else {
		$("#bt_" + pn).text(v);
	    }
	    
	    pn = "label" + i;
	    v = annotatedLabels[pn];
	    if(v == undefined || v == ""){
		$("#bt_" + pn).prop("disabled", true);
	    } else {
		$("#bt_" + pn).text(v);
	    }
	}
    }
});


//pagebeforehide
$(document).on('pagecontainerbeforehide', function(event, ui){

    if(ui.prevPage.is('#home')){
	// get username
	username = $("#username").val();

	// get values of speakers and labels
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    annotatedSpeakers[pn] = $("#" + pn).val();
	    
	    pn = "label" + i;
	    annotatedLabels[pn] = $("#" + pn).val();
	}
    }
});

// push startbutton
$(document).on('tap', '.btn-start', function(event) {
    startTime = new Date();
});


// push annotation_button
$(document).on('tap', '.btn-annotation', function(event) {
    var now = new Date();
    var currentTime = date2FormattedTime(now);
    var elapsedTime = time2FormattedTime(now.getTime() - startTime.getTime());
    var annotation = event.target.innerHTML + "," + username + "," + currentTime + "," + elapsedTime;
    annotationResults.push(annotation);
    displayResults();
    console.log(annotation);
});


$(function (){
})


function date2FormattedTime(date){
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var sec = date.getSeconds();

    hour = hour < 10 ? hour = "0" + hour : hour;
    minutes = minutes < 10 ? minutes = "0" + minutes : minutes;
    sec = sec < 10 ? sec = "0" + sec : sec;

    return  hour + ":" + minutes + ":" + sec;
}


function time2FormattedTime(time){
    var hour = Math.floor(time / 3600000);
    time -= hour * 3600000;
    var minutes = Math.floor(time / 60000);
    time -= minutes * 60000;
    var sec = Math.floor(time / 1000);

    hour = hour < 10 ? hour = "0" + hour : hour;
    minutes = minutes < 10 ? minutes = "0" + minutes : minutes;
    sec = sec < 10 ? sec = "0" + sec : sec;

    return  hour + ":" + minutes + ":" + sec;
}


function displayTime(elementId){
    var now = date2FormattedTime(new Date());
    $(elementId).text(now);
}


function displayResults(){
    var iEnd = annotationResults.length - 1;
    var p = 1;

    for(var i = iEnd; i >= 0 && p <= 2; i--){
	$("#disp" + p).text(annotationResults[i]);
	p++;
    }
}
