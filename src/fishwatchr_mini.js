var now = "";
var nBoxes = 8;
var buttonAreaRatio1 = "300px";
var buttonAreaRatio2 = "450px";
var buttonAreaRatioChange = 5; // if <=5 ratio1, otherwise ratio2 
var annotatedSpeakers = {};
var annotatedLabels = {};
var annotationResults = [];
var pResults = -1;
var nDisp = 2;
var startTime = -1;
var username = "";
var groupname = "";
var annotationMode = "";
var buttonHeightRatio = ["97%", "47%", "30.5%", "22.2%", "17.2%", "14.5%", "12.2%", "10.4%"];
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

//var deletedTargetID = "";

var annotationStorage = [];

var iAnnotationStorage = -1; 

var osname = getOSName();

var dataHandlingMode = "print-as-tsv";

// quoted from http://dotnsf.blog.jp/archives/1012215593.html
// if(window.history && window.history.pushState){
//     console.log("hey");
//     history.pushState("nohb", null, "");
//     $(window).on("popstate", function(event){
// 	console.log("hey1");
// 	if(!event.originalEvent.state){
// 	    console.log("hey2");
//	    history.pushState("nohb", null, "");
// 	    return;
// 	}
//     });
// }


// pagecontainershow
$(document).on('pagecontainerchange', function(event, ui){
    history.pushState(null, null, null);
    console.log("change!!");
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

	if(osname == "iOS"){
	    $('#selector-download-tsv').prop("disabled", true);
	    $('#selector-download-xml').prop("disabled", true);
	} else {
	    $('#selector-download-tsv').prop("disabled", false);
	    $('#selector-download-xml').prop("disabled", false);
	}
	
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


	// change the size of panels for buttons 
	if(na > buttonAreaRatioChange || nb > buttonAreaRatioChange){
	    $("#panel-a").prop("style", "height:" + buttonAreaRatio2);
	    $("#panel-b").prop("style", "height:" + buttonAreaRatio2);
	} else {
	    $("#panel-a").prop("style", "height:" + buttonAreaRatio1);
	    $("#panel-b").prop("style", "height:" + buttonAreaRatio1);
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
	
	// get groupname
	groupname = $("#groupname").val();

	// get vauels of speakers and labels
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    annotatedSpeakers[pn] = sanitizeJ($("#" + pn).val());
	    
	    pn = "label" + i;
	    annotatedLabels[pn] = sanitizeJ($("#" + pn).val());
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

    // get username
    username = $("#username").val();
    if(username == ""){
	$("#popupWarning-message").text("ユーザ名を指定してください。");
	$("#popupWarning").popup("open");
	$("#btn-start").removeClass("ui-btn-active"); // deactivate mannually
	return false;
    } else if(username.match(/^[A-Za-z0-9]+$/) == null){
	$("#popupWarning-message").text("ユーザ名は，数字，もしくは，アルファベットのみで構成してください。");
	$("#popupWarning").popup("open");
	$("#btn-start").removeClass("ui-btn-active"); // deactivate mannually
	return false;
    }
});


// push annotation_button
$(document).on('tap', '.btn-annotation', function(event) {
    var now = new Date();
    var currentTime = date2FormattedDateTime(now, 1);
    var elapsedTime = time2FormattedTime(now.getTime() - startTime.getTime(), 1);
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
    updateAnnotationButtons();
});


$(document).on("change", "#selector-data-handling", function (event) {
    console.log("update buttons!!");
    updateSavenameButtons();
});



// $(document).on('tap', '.disp-button-delete', function(event) {
//     deletedTargetID = event.target.id;
//     console.log("RID:" + event.target.id);
// });


$(document).on('tap', '.disp-button-delete', function(event) {
    var deletedTargetID = event.target.id;
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


$(document).on('tap', '.savename-button', function(event) {
    // index of selected annotation set
    iAnnotationStorage = event.target.id.match(/\d+$/)[0];

    // get dataHandlingMode from the menu
    dataHandlingMode = $("#selector-data-handling").val();

    // get savename
    var savename = $("#savename_" + iAnnotationStorage).text();
    savename = savename.replace(":", "").replace("/", "_").replace(" ", "_");

    // get groupname
    groupname = $("#groupname").val();
    if(groupname != "" && groupname.match(/^[A-Za-z0-9]+$/) == null){
	$("#popupWarning-message").text("グループ名は，数字，もしくは，アルファベットのみで構成してください。");
	$("#popupWarning").popup("open");
    }

    var dataBody = "";
    var fileType = "";

    switch(dataHandlingMode){
    case "print-as-tsv":
	$("#print-annatations").empty();
	$("#print-annatations").append(sanitize(getAnnotationsAsText()).replace(/\n/g, "<br />\n"));
	break;
    case "print-as-xml":
	$("#print-annatations").empty();
	$("#print-annatations").append(sanitize(getAnnotationsAsXML()).replace(/\n/g, "<br />\n"));
	break;
    case "save-to-server":
	var resultURLText = "#";
	var resultURLXML = "#";
	store(savename, groupname, "txt", getAnnotationsAsText())
	    .done(function (response){
		resultURLText = response.result_url;
	    })
	    .fail(function (jqXHR, textStatus){
		console.log("store text data," + textStatus);
	    });
	store(savename, groupname, "xml", getAnnotationsAsXML())
	    .done(function (response){
		resultURLXML = response.result_url;
		$("#resultDataURLText").prop("href", resultURLText);
		$("#resultDataURLXML").prop("href", resultURLXML);
		$("#popupURL").popup("open");
	    })
	    .fail(function (jqXHR, textStatus){
		console.log("store xml data," + textStatus);
	    });
    }
});


function store(savename, groupname, fileType, dataBody){
    var jqXHR = $.ajax({
	url: "store.php",
	type: "post",
	dataType: "json",
	data: {
	    savename: savename,
	    groupname: groupname,
	    fileType: fileType,
	    databody: dataBody
	}
    });

    return jqXHR;
}



$(document).on('tap', '#btn-get-archive', function(event) {
    // get groupname
    groupname = $("#groupname").val();

    if(groupname == ""){
	$("#popupWarning-message").text("グループ名を指定してください。");
	$("#popupWarning").popup("open");
	return false;
    } else if(groupname.match(/^[A-Za-z0-9]+$/) == null){
	$("#popupWarning-message").text("グループ名は，数字，もしくは，アルファベットのみで構成してください。");
	$("#popupWarning").popup("open");
    }
    
    var dataBody = "";
    var fileType = "";
    
    $.ajax({
	url: "archive.php",
	type: "post",
	dataType: "json",
	data: {
	    groupname: groupname
	}
    })
    .done(function (response){
	$("#resultDataURLZIP").prop("href", response.result_url);
	$("#popupGetZipURL").popup("open");
	console.log(response.result_url);
    })
    .fail(function (jqXHR, textStatus){
	console.log("ajax fail!!," + textStatus);
    });
});




function sanitize(str){
    return str.replace(/&/g, "&amp;").
	replace(/</g, "&lt;").
	replace(/>/g, "&gt;").
	replace(/"/g, "&quot;");
}


function sanitizeJ(str){
    return str.replace(/&/g, "＆").
	replace(/</g, "＜").
	replace(/>/g, "＞").
	replace(/"/g, "”");
}



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
	var username = annotationStorage[i].username == "" ?
	    "noname" :
	    annotationStorage[i].username;

	$("#savename-list").append(
	    "<li>" +
		"<a href=\"#\" class=\"ui-btn ui-btn-inline savename-button\" id=\"savename_" + i + "\" data-rel=\"popup\" data-position-to=\"window\" data-transition=\"dialog\">" +
		username + "/" +
		date2FormattedDateTime(annotationStorage[i].starttime).replace(/-/g, "") +
		"</a>" +
		"</li>");
    }
    updateSavenameButtons();
    $("#savename-list").listview("refresh");
}


function updateSavenameButtons(){
    dataHandlingMode = $("#selector-data-handling").val();

    $(".savename-button").each(function() {
	switch(dataHandlingMode){
	case "print-as-tsv":
	    $(this).prop("href", "#popup-print-annatations");
	    $(this).removeAttr("download");
	    break;
	case "print-as-xml":
	    $(this).prop("href", "#popup-print-annatations");
	    $(this).removeAttr("download");
	    break;
	case "save-as-tsv":
	    iAnnotationStorage = this.id.match(/\d+$/)[0];
	    var blobTxt = getAnnotationsAsBlob ("text/plain");
	    $(this).prop("download", "fw_mini_" + username + ".txt");
	    $(this).prop("href", URL.createObjectURL(blobTxt));
	    break;
	case "save-as-xml":
	    iAnnotationStorage = this.id.match(/\d+$/)[0];
	    var blobXML = getAnnotationsAsBlob ("text/xml");
	    $(this).prop("download", "fw_mini_" + username +  ".xml");
	    $(this).prop("href", URL.createObjectURL(blobXML));
	    break;
	case "save-to-server":
	    $(this).prop("href", "#");
	    $(this).removeAttr("download");
	}
    });
}


function date2FormattedTime(date, flagMsec){
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var sec = date.getSeconds();
    var msec = date.getMilliseconds();
    var result = "";

    hour = hour < 10 ? hour = "0" + hour : hour;
    minutes = minutes < 10 ? minutes = "0" + minutes : minutes;
    sec = sec < 10 ? sec = "0" + sec : sec;
    if(msec < 10){
	msec = "00" + msec;
    } else if(msec < 100){
	msec = "0" + msec;
    }

    result = hour + ":" + minutes + ":" + sec;
    if(flagMsec){
	result +=  "." + msec;
    }

    return result;
}



function date2FormattedDateTime(date, flagMsec){
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = month < 10 ? month = "0" + month : month;
    var day = date.getDate();
    day = day < 10 ? day = "0" + day : day;

    return  year + "-" + month + "-" + day + " " + date2FormattedTime(date, flagMsec);
}



function time2FormattedTime(time, flagMsec){
    var hour = Math.floor(time / 3600000);
    time -= hour * 3600000;
    var minutes = Math.floor(time / 60000);
    time -= minutes * 60000;
    var sec = Math.floor(time / 1000);
    time -= sec * 1000;
    var msec = time;
    var result = "";
    
    hour = hour < 10 ? hour = "0" + hour : hour;
    minutes = minutes < 10 ? minutes = "0" + minutes : minutes;
    sec = sec < 10 ? sec = "0" + sec : sec;
    if(msec < 10){
	msec = "00" + msec;
    } else if(msec < 100){
	msec = "0" + msec;
    }

    result = hour + ":" + minutes + ":" + sec;
    if(flagMsec){
	result +=  "." + msec;
    }

    return result;
}

function formattedTime2Sec(ftime){
    if(ftime.match(/^(\d\d):(\d\d):(\d\d)\.(\d\d\d)/)){
	return (RegExp.$1*1000) * 3600 +
	    (RegExp.$2*1000) * 60 +
	    (RegExp.$3*1000) +
	    (RegExp.$4*1);
    } else {
	return -1;
    }
}



function displayTime(elementId){
    var now = date2FormattedTime(new Date());
    $(elementId).text(now);
}


function displayElapsedTime(elementId){
    var now = new Date();
    $(elementId).text(time2FormattedTime(now.getTime() - startTime.getTime()));
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
	var fv = v.split(fseparator);
	fv[fn_ctime] = fv[fn_ctime].replace(/\.\d\d\d$/, "");
	fv[fn_etime] = fv[fn_etime].replace(/\.\d\d\d$/, "");

	result += fv.join(fseparator) + "\n";
    }

    return result;
}


function getAnnotationsAsXML (){
    if(iAnnotationStorage < 0) return;

    var annotationInfo = annotationStorage[iAnnotationStorage];
    var result = "";

    var decXML = '<?xml version="1.0" encoding="UTF-8"?>' + "\n";
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
	date2FormattedDateTime(startTime, 1) + "\" correction_time=\"0\">\n";
    for(var v of annotationInfo.annotations){
	var fv = v.split(fseparator);
	var speaker = fv[fn_speaker];
	var label = fv[fn_label];
	var ctime = fv[fn_ctime];
	var etime = formattedTime2Sec(fv[fn_etime]);

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
	"<comment_list start_time=\"" + date2FormattedDateTime(startTime, 1) + "\" media_file=\"\">\n" +
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
    } else if(ua.match(/iphone|ipad/i)){
	return "iOS"; // the order is important
    } else if(ua.match(/mac/i)){
	return "Mac";
    } else {
	return ua;
    }
}

