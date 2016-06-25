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
var fseparator = "\t";
var fn_speaker = 0;
var fn_label = 1;
var fn_etime = 2;
var fn_ctime = 3;
var fn_username = 4;

var tempAnnotationSpeaker = "";
var tempAnnotationLabel = "";

var timerID = -1;
var timerInterval = 500; 

var deletedTargetID = "";

var annotationStorage = [];

var iAnnotationStorage = -1; 

var osname = getOSName();

// quoted from http://dotnsf.blog.jp/archives/1012215593.html
// if(window.history && window.history.pushState){
//     console.log("hey");
//     history.pushState("nohb", null, "");
//     $(window).on("popstate", function(event){
// 	console.log("hey1");
// 	if(!event.originalEvent.state){
// 	    console.log("hey2");
// 	    history.pushState("nohb", null, "");
// 	    return;
// 	}
//     });
// }


// pagecreate
$(document).on('pagecreate', function(event, ui){
});


// pagecontainershow
$(document).on('pagecontainershow', function(event, ui){
    console.log("osname:" + osname);
    if(ui.toPage.is('#home')){
	// activate the selected tab's navi
	var activeTag = $('#tabs').tabs("option", "active");
	switch(activeTag){
	    case 0: $('#username-tab').trigger('click');
	    break;
	    case 1: $('#annotation-tab').trigger('click');
	    break;
	    case 2: $('#data-tab').trigger('click');
	}
//	writeAnnotations();
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
	timerID = setInterval(displayElapsedTime, timerInterval, "#current_time_observation");

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
		    "<button class=\"btn-annotation ui-button\" id=\"" + newID +
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
		    "<button class=\"btn-annotation ui-button\" id=\"" + newID +
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
	annotationResults = [];
    }
});


//pagebeforehide
$(document).on('pagecontainerbeforehide', function(event, ui){

    if(ui.prevPage.is('#home')){
	// get username
	username = $("#username").val();

	// get vauels of speakers and labels
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    annotatedSpeakers[pn] = $("#" + pn).val();
	    
	    pn = "label" + i;
	    annotatedLabels[pn] = $("#" + pn).val();
	}

	// get annotation mode
	annotationMode = $("#selector1-observation-mode").val();
    } else if(ui.prevPage.is('#observation')){
	console.log("observation page closed!!");
	// save annotations to annotationStorage
	var newdata = {starttime:startTime, username:username, annotations:annotationResults.concat()};
	annotationStorage.push(newdata);
	updateSavenameList();
    }
});


// push startbutton
$(document).on('tap', '#btn-start', function(event) {
    startTime = new Date();
});


// push annotation_button
$(document).on('tap', '.btn-annotation', function(event) {
    var now = new Date();
    var currentTime = date2FormattedDateTime(now);
    var elapsedTime = time2FormattedTime(now.getTime() - startTime.getTime());
    var annotation = "";
    var buttonID = event.target.id;
    var buttonText = event.target.innerHTML;
    
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
    
    annotation = tempAnnotationSpeaker + fseparator + tempAnnotationLabel + fseparator + elapsedTime + fseparator + currentTime + fseparator + username;
    annotationResults.push(annotation);
    displayResults();
    tempAnnotationSpeaker = "-";
    tempAnnotationLabel = "-";
});


// detect change of select menu
$(document).on("change", "#selector2-observation-mode", function () {
    console.log("change!!");
    updateAnnotationButtons();
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
	    annotationResults.splice(iEnd, 1);
	    displayResults();
	    return;
	}
    } else if(deletedTargetID == "disp-button2"){
	if(iEnd >= 1) {
	    annotationResults.splice(iEnd-1, 1);
	    displayResults();
	    console.log("DID:" + deletedTargetID);
	    return;
	}
    }
});


$(document).on('tap', '.print-annotation-button', function(event) {
    var targetID = event.target.id;
    $("#print-annatations").empty();

    if(targetID == "print-as-tsv"){
	$("#print-annatations").append("<pre>" + getAnnotationsAsText() + "</pre>");
    } else if(targetID == "print-as-xml"){
	$("#print-annatations").append(getAnnotationsAsXML());
    } else {
	iAnnotationStorage = targetID.match(/\d+$/)[0];
	$("#print-annatations").append("<pre>" + getAnnotationsAsText() + "</pre>");
    }
});


$(document).on('tap', '.savename-button', function(event) {
    // index of selected annotation set
    iAnnotationStorage = event.target.id.match(/\d+$/)[0];
    var savename = $("#savename_" + iAnnotationStorage).text();
    savename.replace(":", "");
    savename.replace("/", "_");
    var blobTxt = getAnnotationsAsBlob ("text/plain");
    var blobXML = getAnnotationsAsBlob ("text/xml");

    $("#save-as-tsv").attr("download", "fw_mini_" + savename + ".txt");
    $("#save-as-tsv").attr("href", URL.createObjectURL(blobTxt));
    $("#save-as-xml").attr("download", "fw_mini_" + savename + ".xml");
    $("#save-as-xml").attr("href", URL.createObjectURL(blobXML));
//    $("#print-as-xml").attr("href", URL.createObjectURL(blobXML));
//    $("#print-as-tsv").attr("href", URL.createObjectURL(blobXML));

    console.log("vas:" + $("#savename_" + iAnnotationStorage).text());
    console.log("ias:" + iAnnotationStorage);
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


function updateSavenameList(){
    $("#savename-list").empty();
    for(i = annotationStorage.length-1; i >= 0; i--){
	$("#savename-list").append(
	    "<li>" +
		"<a href=\"#popup-print-annatations\" class=\"print-annotation-button\" id=\"savename_" + i + "\" data-rel=\"popup\" data-position-to=\"window\" data-transition=\"dialog\">" +
		date2FormattedTime(annotationStorage[i].starttime) +
		"/" +
		annotationStorage[i].username +
		"</a>" +
		"<a href=\"#popup-dialog-save\" class=\"savename-button\" id=\"savename-button_" + i + "\" data-rel=\"popup\" data-position-to=\"window\" data-transition=\"dialog\"></a>" +
		"</li>");
    }
    $("#savename-list").listview("refresh");
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



function date2FormattedDateTime(date){
    var year = date.getFullYear();
    var month = date.getMonth();
    month = month < 10 ? month = "0" + month : month;
    var day = date.getDay();
    day = day < 10 ? day = "0" + day : day;

    return  year + "-" + month + "-" + day + " " + date2FormattedTime(date);
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


function displayElapsedTime(elementId){
    $(elementId).text(getElapsedTime());
}


function getElapsedTime(){
    var now = new Date();
    return time2FormattedTime(now.getTime() - startTime.getTime());
}


function displayResults(){
    var p = annotationResults.length - 1;

    for(var i = 1; i <= nDisp; i++){
	if(p < 0){
	    $("#disp" + i).text("（直近のアノテーション - なし）");
	} else {
	    $("#disp" + i).text(annotationResults[p--]);
	}
    }
}


function getAnnotationsAsText(){

    if(iAnnotationStorage < 0) return;

    var annotationInfo = annotationStorage[iAnnotationStorage];
    var result = "";

    for (var v of annotationInfo.annotations){
	result += v + "\n";
    }

    return(result);
}


function getAnnotationsAsXML (){
    if(iAnnotationStorage < 0) return;

    var annotationInfo = annotationStorage[iAnnotationStorage];
    var result = "";

    var decXML = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
    var commentTypesXML = "";
    var discussersXML = "";
    var commentXML = "";

    var commentTypes = {};
    var discussers = {};

    for(var v of annotationInfo.annotations){
	var fv = v.split(fseparator);
	commentTypes[fv[fn_label]]++;
	discussers[fv[fn_speaker]]++;
    }

    commentTypesXML = "<comment_types>\n";
    for(var v in commentTypes){
	commentTypesXML += "<li name=\"" + v + "\" color=\"-65536\" />\n";
    }
    commentTypesXML += "</comment_types>\n";
    
    
    discussersXML = "<discussers>\n";
    for(var v in discussers){
	discussersXML += "<li name=\"" + v + "\" />\n";
    }
    discussersXML += "</discussers>\n";
    
    commentXML =
	"<set name=\"noname\" original_start_time=\"" +
	date2FormattedDateTime(startTime) + "\" correction_time=\"0\">\n";
    for(var v of annotationInfo.annotations){
	var fv = v.split(fseparator);
	var speaker = fv[fn_speaker];
	var label = fv[fn_label];
	var ctime = fv[fn_ctime];
	var etime = fv[fn_etime];

	commentXML += "<comment date=\"" + ctime + "\"" +
	    " commenter=\"" + username + "\"" +
	    " discusser=\"" + speaker + "\"" +
	    " comment_type=\"" + label + "\"" +
	    " comment_time=\"" + etime + "\"" +
	    " comment_time_end=\"-1\"></comment>\n";
    }
    commentXML += "</set>\n";

    result =
	decXML +
	"<comment_list start_time=\"" + date2FormattedDateTime(startTime) + "\" media_file=\"\">\n" +
	commentTypesXML +
	discussersXML +
	commentXML +
	"</comment_list>\n";

    return(result);
}


function getAnnotationsAsBlob (fileType){
    if(iAnnotationStorage < 0) return;

    var blob = new Blob();

    if(fileType == "text/plain"){
	blob = new Blob([getAnnotationsAsText()], {type: "text/plain"});
    } else if(fileType == "text/xml"){
	blob = new Blob([getAnnotationsAsXML()], {type: "text/html"});
    }

    return blob;
}


function getOSName(){
    var ua = navigator.userAgent;
    
    if(ua.match(/window/i)){
	return "Windows";
    } else if(ua.match(/linux/i)){
	return "Linux";
    } else if(ua.match(/android/i)){
	return "Android";
    } else if(ua.match(/mac/i)){
	return "Mac";
    } else if(ua.match(/iphone|ipad/i)){
	return "iOS";
    } else {
	return ua;
    }
}

