var now = "";
var nBoxes = 5;
var annotatedSpeakers = {};
var annotatedLabels = {};
var annotationResults = [];
var pResults = -1;
var nDisp = 2;
var startTime = -1;
var username = "name";
var annotationMode = "";
var buttonHeightRatio = ["97%", "47%", "30.5%", "22.2%", "17.2%"];

var tempAnnotationSpeaker = "";
var tempAnnotationLabel = "";

var timerID = -1;
var timerInterval = 500; 

var deletedTargetID = "";

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


// pagecreate
$(document).on('pagecreate', function(event, ui){
});


// pagecontainershow
$(document).on('pagecontainershow', function(event, ui){
    if(ui.toPage.is('#home')){
	$('#username-tab').trigger('click');
	console.log("tabs show!!");
    }
});

// pagecontainerbeforeshow
$(document).on('pagecontainerbeforeshow', function(event, ui){
    if(timerID != -1){
	clearInterval(timerID);
	console.log("timer cleared:" + timerID);
    }

    // observation page
    if(ui.toPage.is('#observation')){
	// start new timer
	timerID = setInterval(displayTime, timerInterval, "#current_time_observation");
//	timerID = setInterval(displayElapsedTime, timerInterval, "#current_time_observation");

	// display username
	$("#current_username").text(username);

	// panel initialization
	$("#panel-a").empty();
	$("#panel-b").empty();

	// count the number of buttons
	var na = 0; // the number of buttons in panel-a
	var nb = 0; // the number of buttons in panel-b

	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    var v = annotatedSpeakers[pn];
	    if(v != undefined && v != ""){na++;}

	    pn = "label" + i;
	    v = annotatedLabels[pn];
	    if(v != undefined && v != ""){nb++;} 
	}


	// set button names
	var ca = 1;
	var cb = 1;
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    var v = annotatedSpeakers[pn];
	    
	    if(v != undefined && v != ""){
		var newID = "bt_speaker" + ca;
		var newTag =
		    "<button class=\"btn-annotation\" id=\"" + newID +
		    "\" style=\"height:" +
		    buttonHeightRatio[na-1] + ";\">" +
		    v +
		    "</button>";
		$("#panel-a").append(newTag);
		if(annotationMode == "mode_label"){
		    $("#" + newID).prop("disabled", true);
		}
		ca++;
	    } 

	    pn = "label" + i;
	    v = annotatedLabels[pn];
	    if(v != undefined && v != ""){
		var newID = "bt_label" + cb;
		var newTag =
		    "<button class=\"btn-annotation\" id=\"" + newID +
		    "\" style=\"height:" +
		    buttonHeightRatio[nb-1] + ";\">" +
		    v +
		    "</button>";
		$("#panel-b").append(newTag);
		if(annotationMode == "mode_speaker"){
		    $("#" + newID).prop("disabled", true);
		}
		cb++;
	    } 
	}
	$("#panel-a").trigger("create");
	$("#panel-b").trigger("create");

	// initialize selectmenu
	$("#selector2-observation-mode").val(annotationMode).selectmenu("refresh");
    } else if(ui.toPage.is('#home')){
	timerID = setInterval(displayTime, timerInterval, "#current_time_home");
	console.log("new timer:" + timerID);
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

	// get annotation mode
	annotationMode = $("#selector1-observation-mode").val();
    }
});

// push startbutton
$(document).on('tap', '#btn-start', function(event) {
    startTime = new Date();
});


// push annotation_button
$(document).on('tap', '.btn-annotation', function(event) {
    var now = new Date();
    var currentTime = date2FormattedTime(now);
    var elapsedTime = time2FormattedTime(now.getTime() - startTime.getTime());
    var annotation = "";
    var buttonID = event.target.id;
    var buttonText = event.target.innerHTML;
    
    console.log(buttonID);
    
    if(annotationMode == "mode_speaker"){
	tempAnnotationSpeaker = buttonText;
	tempAnnotationLabel = "-";
    } else if(annotationMode == "mode_label"){
	tempAnnotationSpeaker = "-";
	tempAnnotationLabel = buttonText;
    } else if(annotationMode == "mode_speaker_label"){
	if(buttonID.indexOf("label") == -1) {
	    tempAnnotationSpeaker = buttonText;
	    return;
	} else {
	    tempAnnotationLabel = buttonText;
	}
    } else if(annotationMode == "mode_label_speaker"){
	if(buttonID.indexOf("speaker") == -1) {
	    tempAnnotationLabel = buttonText;
	    return;
	} else {
	    tempAnnotationSpeaker = buttonText;
	}
    }
    
    annotation = tempAnnotationSpeaker + "," + tempAnnotationLabel + "," + currentTime + "," + elapsedTime + "," + username;
    annotationResults.push(annotation);
    displayResults();
    console.log(annotation);
    tempAnnotationSpeaker = "-";
    tempAnnotationLabel = "-";
});


// detect change of select menu
$(document).on("change", "#selector2-observation-mode", function () {
    updateAnnotationButtons();
});


$(function (){
});


$(document).on('tap', '.disp-button-delete', function(event) {
    deletedTargetID = event.target.id;
    console.log("RID:" + event.target.id);
});


$(document).on('tap', '#disp-delete-execute', function(event) {
    var iEnd = annotationResults.length - 1;
    
    if(deletedTargetID == "disp-button1"){
	if(iEnd >= 0) {
	    console.log("DID:" + deletedTargetID);
	    return;
	}
    } else if(deletedTargetID == "disp-button2"){
	if(iEnd >= 1) {
	    console.log("DID:" + deletedTargetID);
	    return;
	}
    }
});



function updateAnnotationButtons(){

    annotationMode = $("#selector2-observation-mode").val();

    var ca = 1;
    var cb = 1;
    
    for(var i = 1; i <= nBoxes; i++){
	var pn = "speaker" + i;
	var v = annotatedSpeakers[pn];
	
	if(v != undefined && v != ""){
	    var targetID = "#bt_speaker" + ca;
	    if(annotationMode == "mode_label"){
		$(targetID).prop("disabled", true);
	    } else {
		$(targetID).prop("disabled", false);
	    }
	    ca++;
	} 
	
	pn = "label" + i;
	v = annotatedLabels[pn];
	if(v != undefined && v != ""){
	    var targetID = "#bt_label" + cb;
	    if(annotationMode == "mode_speaker"){
		$(targetID).prop("disabled", true);
	    } else {
		$(targetID).prop("disabled", false);
	    }
	    cb++;
	} 
    }
}


function deleteItem(target){
    
    
}


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
