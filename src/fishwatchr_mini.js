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

var cRead = 0;

//var deletedTargetID = "";

var annotationStorage = [];

var iAnnotationStorage = -1; 

var mergedAnnotations = [];
var mergedAnnotationsCurrent = [];
var firstAnnotationTime = 0;
var lastAnnotationTime = 0;

var histgramInterval = 60; // sec

var selectedGraph = 'selector-type-graph'; // default graph
var selectedAttribute = 'attribute-label';
var selectedTimeStyle = 'real-time-style';

var thresholdOutlier = 1800;

var osname = getOSName();

var dataHandlingMode = "print-as-tsv";

var urlSettings = "";
var configUrlOption = "";
var resultDialog = "cancel";

var cBaseTime = 0;

var startRecordingTime = 0;
var timeFilePrefix = "_sys_basetime";

$(document).ready(function(){
    $(window).on("beforeunload", function(event){
	return "unload this page?";
    });

    $("#popup-set-url").on("popupafterclose", function(event, ui){
	if(resultDialog == "cancel"){
	    return;
	}
	if($("#urlSettings").val() == ""){
	    $("#popupWarning-message").text("URLを指定してください。");
	    $("#popupWarning").popup("open");
	} else {
	    urlSettings = $("#urlSettings").val();

	    if(urlSettings.indexOf("http://") != 0 && urlSettings.indexOf("https://") != 0){
		// this url is a candidate
		urlSettings = "http://" + location.host + 
		    location.pathname.replace(/\/[^\/]+$/, "/res/") + urlSettings + ".json";
	    }

	    loadSettings(urlSettings);
	}
    });
    console.log("document ready!!");
});


function loadSettings(url){
    $.ajax({
	url: "read.php",
	type: "post",
	dataType: "json",
	data: {url: url},
	beforeSend: function(jqXHR, settings) {
	    $.mobile.loading('show', {
		text: "Now loading",
		textVisible: true,
		textonly: false
	    });
	}
    }).done(function(data) {
	// read groupname
	if(!checkGroupname(data["groupname"])){
	    $("#popupWarning-message").text("グループ名は，数字・アルファベット・アンダーバーのみで構成してください。");
	    $("#popupWarning").popup("open");
	    return;
	} else {
	    groupname = data["groupname"];
	    $("#groupname").prop("value", groupname);
	}
	
	// read labels
	$.each(data["labels"], function(key, value){
	    $("#label" + (key+1)).prop("value", sanitizeJ(value));
	});
	
	// read speakers
	$.each(data["speakers"], function(key, value){
	    $("#speaker" + (key+1)).prop("value", sanitizeJ(value));
	});
	
	/// set selector value
	$("#selector1-observation-mode")
	    .val(data["observation-mode"])
	    .selectmenu('refresh');
	
	// set button text
	$("#btn-load-settings").text(url);

	// set auto-save option
	if(data["auto-save"] == "true"){
	    $( "#flip-auto-save" ).val("on").flipswitch("refresh");
	} else {
	    $( "#flip-auto-save" ).val("off").flipswitch("refresh");
	}

	// set selectedTimeStyle
	if(data["time-style"] == "elapsed-time-style" || data["time-style"] == "real-time-style"){
	    selectedTimeStyle = data["time-style"];
	}
	$("#" + selectedTimeStyle + "-home").trigger("click"); // tricky code. no click, no refresh.
	$("#" + selectedTimeStyle + "-home").prop("checked", true).checkboxradio('refresh');

	// set thresholdOutlier
	if(Number(data["thresholdOutlier"]) != NaN){
	    thresholdOutlier = data["thresholdOutlier"];
	}
	$("#threshold-outlier").prop("value", thresholdOutlier);
	
    }).fail(function (jqXHR, textStatus, error){
	$("#popupWarning-message").text("設定の読み込みに失敗しました。\n"+ textStatus + ", " + error);
	$("#popupWarning").popup("open");
	console.log("fail!!");
    }).always(function(){
	$.mobile.loading("hide");
    });
}


$(document).on('pagecreate', '#home', function(event, ui){
    // get an url option for 
    configUrlOption = location.search;

    if(location.search.match(/\?config=(.+)/)){
	// ToDo: multiple options
	// config= option must be at the end of the url
	var configUrl = RegExp.$1;

	if(configUrl.indexOf("http://") != 0 && configUrl.indexOf("https://") != 0){
	    // this url is a candidate
	    configUrl = "http://" + location.host + 
		location.pathname.replace(/\/[^\/]+$/, "/res/") + configUrl + ".json";
	}

	loadSettings(configUrl);
	console.log("config url:" + configUrl);
    }
});


$(document).on('pagecontainerchange', function(event, ui){
    history.pushState(null, null, null);
    console.log("history change!!");
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
	    case 2: $('#chart-tab').trigger('click');
	    break;
	    case 3: $('#data-tab').trigger('click');
	}

	if(osname == "iOS"){
	    $('#selector-download-tsv').prop("disabled", true);
	    $('#selector-download-xml').prop("disabled", true);
	} else {
	    $('#selector-download-tsv').prop("disabled", false);
	    $('#selector-download-xml').prop("disabled", false);
	}

	$("#" + selectedTimeStyle + "-home").trigger("click"); // tricky code. no click, no refresh.
	$("#" + selectedTimeStyle + "-home").prop("checked", true).checkboxradio("refresh");
    } else if(ui.toPage.is('#graph')){
	$("#slider-1").on("slidestop", function(e){
	    histgramInterval = $(this).val();
	    drawGraph();
	});

	// The following change event handlers are based on http://jsfiddle.net/ezanker/fu26u/204/
	$("#time1").on("change", function(){
	    var time = selectedTimeStyle == "elapsed-time-style"
		? time2FormattedTime(Number($(this).val())).replace(/:..$/, "")
		: date2FormattedDateTime(new Date(Number($(this).val()))).replace(/^.+ /, "").replace(/:..$/, "");
            $(this).closest(".timeRangeSlider").find(".timeLabel").val(time);
            $(this).closest(".timeRangeSlider").find(".ui-slider-handle").eq(0).prop("title", time);
	});
	$("#time1").on("slidestop", function(e){
	    $("#time1").trigger("change"); // update title
	    var offset = selectedTimeStyle == "elapsed-time-style"
		? startRecordingTime : 0;
	    updateMergedAnnotationsCurrent(
		Number($("#time1").val()) + offset,
		Number($("#time2").val()) + offset);
	    drawGraph();
	});
	
	$("#time2").on("change", function(){
	    var time = selectedTimeStyle == "elapsed-time-style"
		? time2FormattedTime(Number($(this).val())).replace(/:..$/, "")
		: date2FormattedDateTime(new Date(Number($(this).val()))).replace(/^.+ /, "").replace(/:..$/, "");
            $(this).closest(".timeRangeSlider").find(".timeLabel2").val(time);
            $(this).closest(".timeRangeSlider").find(".ui-slider-handle").eq(1).prop("title", time);
	});
	$("#time2").on("slidestop", function(e){
	    $("#time2").trigger("change"); // update title
	    var offset = selectedTimeStyle == "elapsed-time-style"
		? startRecordingTime : 0;
	    updateMergedAnnotationsCurrent(
		Number($("#time1").val()) + offset,
		Number($("#time2").val()) + offset);
	    drawGraph();
	});

	generateGraph();

	$("#" + selectedGraph).trigger("click");
	$("#" + selectedAttribute).prop("checked", true).checkboxradio("refresh");
	$("#" + selectedTimeStyle).prop("checked", true).checkboxradio("refresh");
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

	// update the url of the top page 
	$("#link_to_top").prop("href", "m.html" + configUrlOption);
    } else if(ui.toPage.is('#home')){
	timerID = setInterval(displayTime, timerInterval, "#current_time_home");
	console.log("new timer:" + timerID);
	annotationResults = [];
    } else if(ui.toPage.is('#graph')){
	$("#link_to_top_graph").prop("href", "m.html" + configUrlOption);
    }
});


//pagebeforehide
$(document).on('pagecontainerbeforehide', function(event, ui){

    if(ui.prevPage.is('#home')){
	// get username
	username = $("#username").val();
	
	// get groupname
	groupname = $("#groupname").val().replace(/\$$/, "");

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

	if($("#flip-auto-save-on").prop("selected")){
	    saveToServer();
	    console.log("auto-save");
	} else {
	    console.log("no auto-save");
	}
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
//    } else if(username.match(/[\s!-\/:-@\[-\^`\{-~]/)){
    } else if(username.match(/^[A-Za-z0-9_]+$/) == null){
	$("#popupWarning-message").text("ユーザ名は，数字・アルファベット・アンダーバーのみで構成してください。");
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


// save settings
$(document).on('tap', '#btn-save-settings', function(event) {
    var trueGroupname = $("#groupname").val();
    if(trueGroupname.match(/\$$/)){
	trueGroupname = trueGroupname.replace(/\$$/, "");
	
	if(!checkGroupname(trueGroupname)){
	    $("#popupWarning-message").text("グループ名は，数字・アルファベット・アンダーバーのみで構成してください。");
	    $("#popupWarning").popup("open");
	    return false;
	}
    } else {
	$("#popupWarning-message").text("この機能は，管理者のみが実行できます。");
	$("#popupWarning").popup("open");
	return false;
    }

    var speakers = [];
    var labels = [];
    var mode = $("#selector1-observation-mode").val();
    var auto_save = $("#flip-auto-save").val() == "on" ? "true" : "false";
    var currentThresholdOutlier = $("#threshold-outlier").val();
    
    for(var i = 1; i <=8; i++){
	speakers.push($("#speaker" + i).val())
	labels.push($("#label" + i).val())
    } 

    var settingsJSON = {
	"groupname": trueGroupname,
	"speakers": speakers,
	"labels": labels,
	"observation-mode": mode,
	"auto-save": auto_save,
	"time-style": selectedTimeStyle,
	"thresholdOutlier" : currentThresholdOutlier
    };
    
    var jqXHR = $.ajax({
	url: "save_settings.php",
	type: "post",
	dataType: "json",
	data: {
	    savename: trueGroupname,
	    databody: settingsJSON
	}
    }).done(function (response){
	var url = response.url;
	var error = response.error;

	if(error == "already_exists") {
	    $("#popup-title").text("エラー");
	    $("#popup-message-body").html("<p>このグループの設定はすでに<a href=\"" + url + "\"  target=\"_blank\">登録</a>されています。別のグループ名を付けてください。</p>");
	    $("#popup-message").popup("open");
	} else if(error == "fail_to_copy" || error == "fail_to_save") {
	    $("#popup-title").text("エラー");
	    $("#popup-message-body").html("<p>サーバ側でエラー" + error + "が発生しました。</p>");
	    $("#popup-message").popup("open");
	} else {
	    $("#popup-title").text("保存完了");
	    $("#popup-message-body").html("<p>設定ファイルは，<a href=\"" + url + "\"  target=\"_blank\">サーバ上</a>に保存されました。</p>");
	    $("#popup-message").popup("open");
	}
    }).fail(function (jqXHR, textStatus, error){
	console.log("store xml data, " + textStatus + ", " + error);
    });
});


// recording the current time
$(document).on('tap', '#btn-get-basetime', function(event) {
    var newStartTime = new Date();
    var newname = timeFilePrefix;
    var dummyResults = [];

    var trueGroupname = $("#groupname").val();
    if(trueGroupname.match(/\$$/)){
	trueGroupname = trueGroupname.replace(/\$$/, "");
	
	if(!checkGroupname(trueGroupname)){
	    $("#popupWarning-message").text("グループ名は，数字・アルファベット・アンダーバーのみで構成してください。");
	    $("#popupWarning").popup("open");
	    return false;
	} else {
	    newname += "_" + cBaseTime + "_" + trueGroupname;
	    cBaseTime++;
	}
    } else {
	$("#popupWarning-message").text("この機能は，管理者のみが実行できます。");
	$("#popupWarning").popup("open");
	return false;
    }

    var newdata = {starttime:newStartTime, username:newname, annotations:dummyResults.concat()};
    annotationStorage.push(newdata);
    updateSavenameList();

    if($("#flip-auto-save-on").prop("selected")){
	saveToServer();
	console.log("auto-save");
    } else {
	console.log("no auto-save");
    }
});


// draw charts
$(document).on('tap', '#btn-show-graph', function(event) {
    thresholdOutlier = $("#threshold-outlier").val();
    groupname = $("#groupname").val().replace(/\$$/, "");

    if(thresholdOutlier == ""){
	thresholdOutlier = Number.MAX_VALUE;
    } else if(isNaN(thresholdOutlier) || thresholdOutlier < 0){
	$("#popupWarning-message").text("０より大きい値を指定してください。");
	$("#popupWarning").popup("open");
	$("#btn-show-graph").removeClass("ui-btn-active"); // deactivate mannually
	return false;
    } else if(!checkGroupname(groupname)){
	$("#popupWarning-message").text("グループ名は，数字・アルファベット・アンダーバーのみで構成してください。");
	$("#popupWarning").popup("open");
	$("#btn-show-graph").removeClass("ui-btn-active"); // deactivate mannually
	return false;
    } else {
	thresholdOutlier *= 1000; // milisec
    }
});


// detect change of select menu
$(document).on("change", "#selector2-observation-mode", function () {
    updateAnnotationButtons();
});


$(document).on("change", "#selector-data-handling", function (event) {
    console.log("update buttons!!");
    updateSavenameButtons();
});


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
    saveToServer(event);
});


$(document).on('tap', '.graph-selector', function(event) {
    selectedGraph = event.target.id;
    drawGraph();
});


$(document).on('change', '.attribute-selector', function(event) {
    selectedAttribute = event.target.id;
    drawGraph();
});

$(document).on('change', '.time-style-selector', function(event) {
    selectedTimeStyle = event.target.value;
    changeTimeStyle();
    drawGraph();
});



function saveToServer(event){
    if(event == null){
	// when auto-save
	iAnnotationStorage = annotationStorage.length-1;
	dataHandlingMode = "save-to-server";
    } else {
	// index of selected annotation set
	iAnnotationStorage = event.target.id.match(/\d+$/)[0];
	// get dataHandlingMode from the menu
	dataHandlingMode = $("#selector-data-handling").val();
    }
    
    // get savename
    var savename = $("#savename_" + iAnnotationStorage).text();
    savename = savename.replace(":", "").replace("/", "_").replace(" ", "_");

    // get groupname
    groupname = $("#groupname").val().replace(/\$$/, "");
    if(groupname != "" && groupname.match(/^[A-Za-z0-9_]+$/) == null){
	$("#popupWarning-message").text("グループ名は，数字・アルファベット・アンダーバーのみで構成してください。");
	$("#popupWarning").popup("open");
	return false;
    }

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
	break;
    }
}


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
    groupname = $("#groupname").val().replace(/\$$/, "");

    if(groupname == ""){
	$("#popupWarning-message").text("グループ名を指定してください。");
	$("#popupWarning").popup("open");
	return false;
    } else if(groupname.match(/^[A-Za-z0-9_]+$/) == null){
	$("#popupWarning-message").text("グループ名は，数字・アルファベット・アンダーバーのみで構成してください。");
	$("#popupWarning").popup("open");
	return false;
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


$(document).on('tap', '#popup-set-url-ok', function(event) {
    resultDialog = "ok";
});

$(document).on('tap', '#popup-set-url-cancel', function(event) {
    resultDialog = "cancel";
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
	date2FormattedDateTime(annotationInfo.starttime, 1) + "\" correction_time=\"0\">\n";
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
	"<comment_list start_time=\"" + date2FormattedDateTime(annotationInfo.starttime, 1) + "\" media_file=\"\">\n" +
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


function checkGroupname(groupname){
    if(groupname.match(/^[A-Za-z0-9_]+$/)){
	return true;
    } else {
	return false;
    }
}


function updateMergedAnnotationsCurrent(begin, end){
    mergedAnnotationsCurrent = new Array();

    var j = 0;
    for(var i = 0; i < mergedAnnotations.length; i++){
	var time = mergedAnnotations[i][5];
	if(time < begin || time > end) continue;
	mergedAnnotationsCurrent[j++] = mergedAnnotations[i];
    }
}


function generateGraph(){
    // groupname, thresholdOutlier are needed to set
    var timeMedian = -1;
    var prevTime = -1;

    startRecordingTime = 0;
    mergedAnnotations = [];
    mergedAnnotationsCurrent = [];

    $.ajax({
	url: "get_merged_data.php",
	type: "post",
	dataType: "text",
	data: {
	    groupname: groupname,
	    timefile: timeFilePrefix
	},
	//async: false
    }).done(function(data) {
	var arrayAnnotations = data.split("\n");

	// get start-recording-time
	if(arrayAnnotations.length == 0){
	    // do nothing
	} else if(arrayAnnotations[0].match(new RegExp("^" + timeFilePrefix + "\t(.+)"))){
	    // get and remove a time information record
	    startRecordingTime = Date.parse(RegExp.$1.replace(/-/g, "/").replace(/\.\d\d\d$/, ""));
	    arrayAnnotations.shift();
	}
	
	for(var i = 0; i < arrayAnnotations.length; i++){
	    if(arrayAnnotations[i] == "") continue;
	    var arrayFields = arrayAnnotations[i].split("\t");
	    arrayFields.push(Date.parse(arrayFields[3].replace(/-/g, "/")));
	    mergedAnnotations[i] = arrayFields;
	}
	
	// sort by date
	mergedAnnotations.sort(function(a, b){
	    if(a[5] < b[5]){
		return -1;
	    } else {
		return 1;
	    }
	});

	// startRecordingTime is the time of the first record, if no time information record
	if(startRecordingTime == 0 && mergedAnnotations.length > 0){
	    startRecordingTime = mergedAnnotations[0][5];
	}

	// median
	var len = mergedAnnotations.length;
	if(len == 0){
	    timeMedian = 0;
	} else if(len % 2 == 0){
	    timeMedian = (mergedAnnotations[len/2][5] + mergedAnnotations[len/2 + 1][5]) / 2;
	} else {
	    timeMedian = mergedAnnotations[(len+1)/2][5];
	}
	
	var iStart = 0;
	var iEnd = len;
	for(var i = 0; i < mergedAnnotations.length; i++){
	    // outliers
	    if(prevTime != -1 && mergedAnnotations[i][5] - prevTime > thresholdOutlier){
		if(timeMedian > mergedAnnotations[i][5]){
		    iStart = i;
		} else {
		    iEnd = i;
		    break;
		}
	    }
	    prevTime = mergedAnnotations[i][5];
	}

	var tempArray = [];
	var j = 0;
	for(var i = iStart; i < iEnd; i++){
	    tempArray[j++] = mergedAnnotations[i];
	}
	mergedAnnotations = tempArray;

	
	// copy 
	for(var i = 0; i < mergedAnnotations.length; i++){
	    mergedAnnotationsCurrent[i] = mergedAnnotations[i];
	}
	
	if(mergedAnnotations.length != 0){
	    firstAnnotationTime = mergedAnnotationsCurrent[0][5];
	    lastAnnotationTime = mergedAnnotationsCurrent[mergedAnnotationsCurrent.length-1][5];
	} else {
	    // dummy time
	    firstAnnotationTime = new Date(2000, 1, 1, 0, 0, 0).getTime();
	    lastAnnotationTime = new Date(2000, 1, 1, 1, 0, 0).getTime();
	}

	initSlider();
	drawGraph();
    });
}

function initSlider(){
    var timeMin = 0;
    var timeMax = 0;
    
    if(selectedTimeStyle == "elapsed-time-style"){
	timeMin = firstAnnotationTime-startRecordingTime;
	timeMax = lastAnnotationTime-startRecordingTime;
	$("#time1label").val(time2FormattedTime(timeMin).replace(/:..$/, ""));
	$("#time2label").val(time2FormattedTime(timeMax).replace(/:..$/, ""));
    } else {
	timeMin = firstAnnotationTime;
	timeMax = lastAnnotationTime;
	$("#time1label").val(date2FormattedDateTime(new Date(timeMin)).replace(/^.+ /, "").replace(/:..$/, ""));
	$("#time2label").val(date2FormattedDateTime(new Date(timeMax)).replace(/^.+ /, "").replace(/:..$/, ""));
    }
	
    $("#time1").val(timeMin);
    $("#time1").prop("min", timeMin);
    $("#time1").prop("max", timeMax);
    $("#time2").val(timeMax);
    $("#time2").prop("min", timeMin);
    $("#time2").prop("max", timeMax);
}



function changeTimeStyle(){
    var currentTime1 = Number($("#time1").val());
    var currentTime2 = Number($("#time2").val());

    var currentTime = 0;
    var timeMin = 0;
    var timeMax = 0;
    
    if(selectedTimeStyle == "elapsed-time-style"){
	currentTime1 = currentTime1-startRecordingTime;
	currentTime2 = currentTime2-startRecordingTime;
	timeMin = firstAnnotationTime-startRecordingTime;
	timeMax = lastAnnotationTime-startRecordingTime;
	$("#time1label").val(time2FormattedTime(currentTime1).replace(/:..$/, ""));
	$("#time2label").val(time2FormattedTime(currentTime2).replace(/:..$/, ""));
    } else {
	currentTime1 = currentTime1+startRecordingTime;
	currentTime2 = currentTime2+startRecordingTime;
	timeMin = firstAnnotationTime;
	timeMax = lastAnnotationTime;
	$("#time1label").val(date2FormattedDateTime(new Date(currentTime1)).replace(/^.+ /, "").replace(/:..$/, ""));
	$("#time2label").val(date2FormattedDateTime(new Date(currentTime2)).replace(/^.+ /, "").replace(/:..$/, ""));
    }
	
    $("#time1").val(currentTime1);
    $("#time1").prop("min", timeMin);
    $("#time1").prop("max", timeMax);
    $("#time2").val(currentTime2);
    $("#time2").prop("min", timeMin);
    $("#time2").prop("max", timeMax);
}


function drawGraph(){
    var type = {};
    var typeNames = new Array();
    var x = ['x'];
    var y = ['freq'];
    var xTimes = [];
    var arrayColumns = [];
    var flagLegend = true;
    var iAttribute = selectedAttribute == 'attribute-speaker' ? 0 : 1;
    
    if(selectedGraph == 'selector-type-graph'|| selectedGraph == ""){
	// get all typeNames even if not in mergedAnnotationsCurrent
	for(var i = 0; i < mergedAnnotations.length; i++){
	    var value = mergedAnnotations[i][iAttribute];
	    if(!(value in type)){
		typeNames.push(value);
	    }
	}

	for(var i = 0; i < mergedAnnotationsCurrent.length; i++){
	    var value = mergedAnnotationsCurrent[i][iAttribute];
	    if(value in type){
		type[value]++;
	    } else {
		type[value] = 1;
	    }
	}

	// sort typeNames to maintain the same order any time
	typeNames.sort();
	
	for(var i = 0; i < typeNames.length; i++){
	    x.push(typeNames[i]);
	    if(typeNames[i] in type){
		y.push(type[typeNames[i]]);
	    } else{
		y.push(0);
	    }
	}
	arrayColumns[0] = x;
	arrayColumns[1] = y;
	flagLegend = false;
    } else {
	var temp = {};
	var categoryFreqs = {};
	var categories = {};
	var prevTime = 0;
	
	for(var i = 0; i < mergedAnnotationsCurrent.length; i++){
	    var time = Math.floor(mergedAnnotationsCurrent[i][5]/histgramInterval/1000);
	    var category = mergedAnnotationsCurrent[i][iAttribute];

	    // insert axises whose frequency is 0
	    if(time - prevTime > 1 && prevTime != 0){
		var addedTime = prevTime + 1;
		while(addedTime < time){
		    type[addedTime] = 0;
		    addedTime++;
		}
	    }
	    prevTime = time;
	    
	    if(time in type){
		type[time]++;
	    } else {
		type[time] = 1;
	    }
	    
	    if(category in categories == false){
		categories[category] = 1;
	    }
	    
	    var key = category + "\t" + time;
	    if(key in temp){
		temp[key]++;
	    } else {
		temp[key] = 1;
	    }
	}
	
	for(var i in type){
	    var d = new Date(i * histgramInterval * 1000);
	    if(selectedTimeStyle == "real-time-style"){
		x.push(d.toTimeString().replace(/GMT.*/,"").replace(/:/g,""));
		xTimes.push(time2FormattedTime(d - startRecordingTime).replace(/:/g,""));
	    } else {
		// elapsed-time-style
		x.push(time2FormattedTime(d - startRecordingTime).replace(/:/g,""));
		xTimes.push(d.toTimeString().replace(/GMT.*/,"").replace(/:/g,""));
	    }
	    y.push(type[i]);
 
	    for(var category in categories){
		var key = category + "\t" + i;
		if(category in categoryFreqs == false){
		    categoryFreqs[category] = [category];
		}
		
		if(key in temp){
		    categoryFreqs[category].push(temp[key]);
		} else {
		    categoryFreqs[category].push(0);
		}
	    }
	}
	arrayColumns[0] = x;
	arrayColumns[1] = y;
	
	for(var category in categories){
	    arrayColumns.push(categoryFreqs[category]);
	}
    }
    
    var chart = c3.generate({
	bindto: '#graph_body',
	data: {
	    x: 'x',
	    columns: arrayColumns,
	    types: {
		freq: 'bar'
	    }
	},
	axis: {
	    x: {
		type: 'category',
	    }
	},
	padding: {
	    bottom: 60
	},
	legend: {
	    show: flagLegend,
	    position: 'bottom',
	    inset: {
		anchor: 'top-right',
		x: 20,
		y: 10,
		step: 2
	    }
	},
	tooltip: {
	    format: {
		title: function (x) {
		    // real time and elapsed time
		    if(selectedGraph == 'selector-timeline-graph'){
			return arrayColumns[0][x+1].replace(/(..)(..)(..)/,"$1:$2:$3") 
			    + " (" + xTimes[x].replace(/(..)(..)(..)/,"$1:$2:$3") + ")";
		    } else {
			// selector-type-graph
			return arrayColumns[0][x+1];
		    }
		}
	    },
	    position: function(data, width, height, thisElement){
		// based on https://github.com/c3js/c3/issues/1107
		var containerWidth, tooltipWidth, x;
		var element = document.getElementById("graph_body");
		containerWidth = element.clientWidth;
		tooltipWidth = element.querySelector('.c3-tooltip-container').clientWidth;
		x = parseInt(thisElement.getAttribute('x'));

		if (x > containerWidth / 2) {
		    x = x - tooltipWidth;
		} else  {
		    x = x + tooltipWidth/2;
		}
		return {
		    top: parseInt(thisElement.getAttribute('y')),
		    left: x
		};		
	    }
	},
	zoom: {
	    enabled: false
	}
    });
}
