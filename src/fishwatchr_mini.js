var now = "";
var nBoxes = 8;
var shortcutKeys = ["q", "w", "e", "r", "t", "y", "u", "i", "o"]; // nBox <= 9
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
var fn_etime = 2; // elapsed time (string)
var fn_ctime = 3; // date & time (string)
var fn_username = 4;
var fn_ptime = 5; // Date.parsed ctime (number)

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

var selectedGraph = 'selector-summary-graph'; // default graph
var selectedAttribute = 'attribute-label';
var selectedTimeStyle = 'real-time-style';
var selectedObserver = 'all';

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
	    $("#popupWarning-message").text($.i18n("fwm-message-specify-url"));
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
	    $("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
	    $("#popupWarning").popup("open");
	    return;
	} else {
	    groupname = data["groupname"].replace(/^ +/, "").replace(/ +$/, "");
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
	$("#popupWarning-message").text($.i18n("") + "\n"+ textStatus + ", " + error);
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
	histgramInterval = $("#slider-1").val();
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

$(document).on('pagebeforecreate', function(event, ui){
    $.i18n( {
	locale: 'ja'
    } );

    $.i18n().load( {
	ja: 'i18n/ja.json',
	en: 'i18n/en.json',
    }).done( function() {
	changeLang();
    } ).fail(function (jqXHR, textStatus, error){
	console.log('fail1!');
    });
});


function changeLang(){
        $('#home').i18n();
        $('#observation').i18n();
        $('#graph').i18n();

	$("#groupname").textinput("option", "clearBtnText", $.i18n("fwm-m-data-clear-btn-text"));
	$("#username").textinput("option", "clearBtnText", $.i18n("fwm-m-data-clear-btn-text"));
	$("#username").prop("placeholder", $.i18n("fwm-m-label-placeholder"));
	$("#label1").val($.i18n("fwm-m-button-label") + "1");
	$("#label2").val($.i18n("fwm-m-button-label") + "2");
	$("#speaker1").val($.i18n("fwm-m-button-target") + "1");
	$("#speaker2").val($.i18n("fwm-m-button-target") + "2");
	for(i = 1; i <= 8; i++){
	    $("#label" + i).textinput("option", "clearBtnText", $.i18n("fwm-m-data-clear-btn-text"));
	    $("#speaker" + i).textinput("option", "clearBtnText", $.i18n("fwm-m-data-clear-btn-text"));
	    $("#label" + i).prop("placeholder", $.i18n("fwm-m-button-label"));
	    $("#speaker" + i).prop("placeholder", $.i18n("fwm-m-button-target"));
	}
	// refresh selector
	$("#selector1-observation-mode").selectmenu('refresh');
	$("#selector2-observation-mode").selectmenu('refresh');
	$("#selector-data-handling").selectmenu('refresh');
	$("#select-attribute").selectmenu('refresh');
	$("#select-observer").selectmenu('refresh');
}


// pagecontainerbeforeshow
$(document).on('pagecontainerbeforeshow', function(event, ui){
    if(timerID != -1){
	clearInterval(timerID);
	console.log("timer cleared:" + timerID);
    }

    removeShortcutAll();
    
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

	var shortcutCallback = (function (target, num) {
	    return function () {
		if(!$("#" + target + num).prop("disabled")){
		    $("#" + target + num).trigger('tap');
		}
	    };
	});
	

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
			shortcut.add(shortcutKeys[ca-1],
				     shortcutCallback("bt_speaker", ca));
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
		shortcut.add(cb + "", shortcutCallback("bt_label", cb));
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
	selectedAttribute = "attribute-label";
	selectedGraph = "selector-summary-graph";
    } else if(ui.toPage.is('#graph')){
	$("#link_to_top_graph").prop("href", "m.html" + configUrlOption);
	$("#graph_body").disableSelection();
    }
});


//pagebeforehide
$(document).on('pagecontainerbeforehide', function(event, ui){

    if(ui.prevPage.is('#home')){
	// get username
	username = $("#username").val().replace(/^ +/, "").replace(/ +$/, "");
	$("#username").prop("value", username);
	
	// get groupname
	groupname = $("#groupname").val().replace(/^ +/, "").replace(/ +$/, "");
	$("#groupname").prop("value", groupname);
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
    username = $("#username").val().replace(/^ +/, "").replace(/ +$/, "");
    $("#username").prop("value", username);
    
    if(username == ""){
	$("#popupWarning-message").text($.i18n("fwm-message-username-error"));
	$("#popupWarning").popup("open");
	$("#btn-start").removeClass("ui-btn-active"); // deactivate mannually
	return false;
//    } else if(username.match(/[\s!-\/:-@\[-\^`\{-~]/)){
    } else if(username.match(/^[A-Za-z0-9_]+$/) == null){
	$("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
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
	} else if(tempAnnotationSpeaker == "" || tempAnnotationSpeaker == "-"){
	    return;
	} else {
	    tempAnnotationLabel = buttonText;
	}
    } else if(annotationMode == "mode_label_speaker"){
	if(buttonID.indexOf("speaker") == -1) {
	    tempAnnotationLabel = buttonText;
	    return;
	} else if(tempAnnotationLabel == "" || tempAnnotationLabel == "-"){
	    return;
	} else {
	    tempAnnotationSpeaker = buttonText;
	}
    }
    
    annotation = tempAnnotationSpeaker + fseparator + tempAnnotationLabel + fseparator + elapsedTime + fseparator + currentTime + fseparator + username;
    annotationResults.push(annotation);
    displayResults();
    // blink the button
    $("#" + buttonID).fadeOut(100, function(){
	$(this).fadeIn(100);
    });
    tempAnnotationSpeaker = "-";
    tempAnnotationLabel = "-";
});


// save settings
$(document).on('tap', '#btn-save-settings', function(event) {
    var trueGroupname = $("#groupname").val().replace(/^ +/, "").replace(/ +$/, "");
    $("#groupname").prop("value", trueGroupname);

    if(trueGroupname.match(/\$$/)){
	trueGroupname = trueGroupname.replace(/\$$/, "");
	
	if(!checkGroupname(trueGroupname)){
	    $("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
	    $("#popupWarning").popup("open");
	    return false;
	}
    } else {
	$("#popupWarning-message").text($.i18n("fwm-message-permission-error"));
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
	    $("#popup-title").text($.i18n("fwm-m-title-error"));
	    $("#popup-message-body").html("<p>" + $.i18n("fwm-message-group-already-exist-error") + "</p>");
	    $("#popup-message").popup("open");
	} else if(error == "fail_to_copy" || error == "fail_to_save") {
	    $("#popup-title").text($.i18n("fwm-m-title-error"));
	    $("#popup-message-body").html("<p>"
		  + $.i18n("fwm-message-server-error")
		  + "<br />"
		  + error + "</p>");
	    $("#popup-message").popup("open");
	} else {
	    $("#popup-title").text($.i18n("fwm-js-title-save-complete"));
	    $("#popup-message-body").html("<p>"
		  + $.i18n("fwm-message-config-save-complete")
		  + " (<a href=\"" + url + "\" target=\"_blank\">URL</a>)"
		  + "</p>");
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

    var trueGroupname = $("#groupname").val().replace(/^ +/, "").replace(/ +$/, "");
    $("#groupname").prop("value", trueGroupname);
    
    if(trueGroupname.match(/\$$/)){
	trueGroupname = trueGroupname.replace(/\$$/, "");
	
	if(!checkGroupname(trueGroupname)){
	    $("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
	    $("#popupWarning").popup("open");
	    return false;
	} else {
	    newname += "_" + cBaseTime + "_" + trueGroupname;
	    cBaseTime++;
	}
    } else {
	$("#popupWarning-message").text($.i18n("fwm-message-permission-error"));
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
    groupname = $("#groupname").val().replace(/^ +/, "").replace(/ +$/, "");
    $("#groupname").prop("value", groupname);
    groupname = $("#groupname").val().replace(/\$$/, "");

    if(thresholdOutlier == ""){
	thresholdOutlier = Number.MAX_VALUE;
    } else if(isNaN(thresholdOutlier) || thresholdOutlier < 0){
	$("#popupWarning-message").text($.i18n("fwm-message-invalid-threshold-error"));
	$("#popupWarning").popup("open");
	$("#btn-show-graph").removeClass("ui-btn-active"); // deactivate mannually
	return false;
    } else if(!checkGroupname(groupname)){
	$("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
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


$(document).on('tap', '.fw-lang-item', function(event) {
    var selectedLang = event.target.id.replace(/^lang-item-/, "");

    $.i18n( {
	locale: selectedLang
    } );
    $("#popupLangMenu").popup("close");
    $("#lang-selector-button").text($("#" + event.target.id).text());
    changeLang();
});

$(document).on('tap', '.fw-option-item', function(event) {
    $("#popupInfoMenu").popup("close");
});



$(document).on('tap', '.graph-selector', function(event) {
    selectedGraph = event.target.id;
    drawGraph();
});

$(document).on('change', '.attribute-selector', function(event) {
    selectedAttribute = event.target.id;
    // change the value of attribute-selector-summary
    $("#select-attribute")
	.val(selectedAttribute)
	.selectmenu('refresh');
    drawGraph();
});

$(document).on('change', '.time-style-selector', function(event) {
    selectedTimeStyle = event.target.value;
    changeTimeStyle();
    drawGraph();
});

$(document).on('change', '#select-observer', function(event) {
    var selectedOption = $(this).find('option:selected');
    selectedObserver = selectedOption.val(); 
    drawGraph();
});

$(document).on('change', '#attribute-selector-summary', function(event) {
    var selectedOption = $(this).find('option:selected');
    selectedAttribute = selectedOption.val();
    // change the value of attribute-selector-timeline
    if(selectedAttribute == "attribute-label"){
	$("#attribute-observation-target")
	    .prop("checked", false)
	    .checkboxradio("refresh");
	$("#attribute-label")
	    .prop("checked", true)
	    .checkboxradio("refresh");
    } else {
	$("#attribute-observation-target")
	    .prop("checked", true)
	    .checkboxradio("refresh");
	$("#attribute-label")
	    .prop("checked", false)
	    .checkboxradio("refresh");
    }
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
    groupname = $("#groupname").val().replace(/^ +/, "").replace(/ +$/, "");
    $("#groupname").prop("value", groupname);
    groupname = $("#groupname").val().replace(/\$$/, "");
    
    if(groupname != "" && groupname.match(/^[A-Za-z0-9_]+$/) == null){
	$("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
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
    groupname = $("#groupname").val().replace(/^ +/, "").replace(/ +$/, "");
    $("#groupname").prop("value", groupname);
    groupname = $("#groupname").val().replace(/\$$/, "");

    if(groupname == ""){
	$("#popupWarning-message").text("fwm-message-no-groupname-error");
	$("#popupWarning").popup("open");
	return false;
    } else if(groupname.match(/^[A-Za-z0-9_]+$/) == null){
	$("#popupWarning-message").text($.i18n("fwm-message-groupname-error"));
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


function removeShortcutAll(){
    for(var sc in shortcut.all_shortcuts){
	shortcut.remove(sc);
    }
}


function updateSavenameList(){
    $("#savename-list").empty();
    for(i = annotationStorage.length-1; i >= 0; i--){
	var newUsername = annotationStorage[i].username == "" ?
	    "noname" :
	    annotationStorage[i].username;

	$("#savename-list").append(
	    "<li>" +
		"<a href=\"#\" class=\"ui-btn ui-btn-inline savename-button\" id=\"savename_" + i + "\" data-rel=\"popup\" data-position-to=\"window\" data-transition=\"dialog\">" +
		newUsername + "/" +
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
	    $("#disp" + i).text($.i18n("fwm-no-annotation-data"));
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
	var time = mergedAnnotations[i][fn_ptime];
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
	    arrayFields.push(Date.parse(arrayFields[fn_ctime].replace(/-/g, "/")));
	    mergedAnnotations[i] = arrayFields;
	}
	
	// sort by date
	mergedAnnotations.sort(function(a, b){
	    if(a[fn_ptime] < b[fn_ptime]){
		return -1;
	    } else {
		return 1;
	    }
	});

	// startRecordingTime is the time of the first record, if no time information record
	if(startRecordingTime == 0 && mergedAnnotations.length > 0){
	    startRecordingTime = mergedAnnotations[0][fn_ptime];
	}

	// median
	var len = mergedAnnotations.length;
	if(len == 0){
	    timeMedian = 0;
	} else if(len % 2 == 0){
	    timeMedian = (mergedAnnotations[len/2][fn_ptime] + mergedAnnotations[len/2 + 1][fn_ptime]) / 2;
	} else {
	    timeMedian = mergedAnnotations[(len+1)/2][fn_ptime];
	}
	
	var iStart = 0;
	var iEnd = len;
	for(var i = 0; i < mergedAnnotations.length; i++){
	    // outliers
	    if(prevTime != -1 && mergedAnnotations[i][fn_ptime] - prevTime > thresholdOutlier){
		if(timeMedian > mergedAnnotations[i][fn_ptime]){
		    iStart = i;
		} else {
		    iEnd = i;
		    break;
		}
	    }
	    prevTime = mergedAnnotations[i][fn_ptime];
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
	    firstAnnotationTime = mergedAnnotationsCurrent[0][fn_ptime];
	    lastAnnotationTime = mergedAnnotationsCurrent[mergedAnnotationsCurrent.length-1][fn_ptime];
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
    var nType = {};
    var typeNames = new Array();
    var typeNames2 = new Array();
    var observerTypes = [];
    var xTimes = [];
    var arrayColumns = [];
    var flagLegend = true;
    var chartType = "";
    var iAttribute = selectedAttribute == 'attribute-label' ?  fn_label : fn_speaker;
    var observerType = $("#select-observer").find('option:selected').val();
    var maxEvaluationGrade = undefined;
    
    if(selectedGraph == 'selector-summary-graph'|| selectedGraph == ""){
	// change ui
	$("#range-slider").hide();
	$("#timedisplay-type-selector").hide();
	$("#label-timeRangeSlider").show();
	$("#observer-selector").show();
	$("#attribute-selector-summary").show();
	$("#attribute-selector-timeline").hide();

	var iAttribute2;
	if(selectedAttribute == 'attribute-label'){
	    iAttribute2 = fn_speaker;
	} else {
	    iAttribute2 = fn_label;
	}

	// initialize typeNames and maxEvaluationGrade
	for(var i = 0; i < mergedAnnotations.length; i++){
	    var value = mergedAnnotations[i][iAttribute];
	    if(!typeNames.includes(value)){
		typeNames.push(value);
	    }
	    var value2 = mergedAnnotations[i][iAttribute2];
	    if(!typeNames2.includes(value2)){
		typeNames2.push(value2);
	    }

	    if(selectedAttribute == "attribute-eval-average"){
		var evaluationGrade = mergedAnnotations[i][fn_label];
		if(maxEvaluationGrade == undefined
		   ||  maxEvaluationGrade < evaluationGrade){
		    maxEvaluationGrade = Number(evaluationGrade);
		}
	    }
	}

	// sort typeNames to maintain the same order any time
	typeNames.sort();
	typeNames2.sort();

	// initialize type
	for(var i = 0; i < typeNames.length; i++){
	    type[typeNames[i]] = new Array();
	    nType[typeNames[i]] = new Array();
	    
	    switch(observerType){
	    case "all":
	    case "user-only":
		for(var j = 0; j < typeNames2.length; j++){
		    type[typeNames[i]][typeNames2[j]] = 0;
		}
		break;
	    case "user-comparison":
		type[typeNames[i]]['user'] = 0;
		type[typeNames[i]]['others'] = 0;
		break;
	    case "all-comparison":
		for(var j = 0; j < mergedAnnotations.length; j++){
		    var dataUsername = mergedAnnotations[j][fn_username];
		    type[typeNames[i]][dataUsername] = 0;
		}
	    }
	}

	// count frequency
	for(var i = 0; i < mergedAnnotationsCurrent.length; i++){
	    var value = mergedAnnotationsCurrent[i][iAttribute];
	    var value2 = mergedAnnotationsCurrent[i][iAttribute2];
	    var dataUsername = mergedAnnotations[i][fn_username];
	    var label = mergedAnnotationsCurrent[i][fn_label];
	    
	    switch(observerType){
	    case "all":
		accumulate(type, value, value2, label, nType);
		break;
	    case "user-only":
		if(dataUsername == username){
		    accumulate(type, value, value2, label, nType);
		}
		break;
	    case "user-comparison":
		if(dataUsername == username){
		    accumulate(type, value, 'user', label, nType);
		} else {
		    accumulate(type, value, 'others', label, nType);
		}
		break;
	    case "all-comparison":
		accumulate(type, value, dataUsername, label, nType);
	    }
	}

	// get oberverTypes
	switch(observerType){
	case "all":
	    observerTypes.push("all");
	    break;
	case "user-only":
	    observerTypes.push("user");
	    break;
	case "user-comparison":
	    observerTypes.push("user");
	    observerTypes.push("others");

	    // calc average
	    var tmpUsernames = {};
	    for(var i = 0; i < mergedAnnotations.length; i++){
		tmpUsernames[mergedAnnotations[i][fn_username]]++;
	    }
	    var nUsers = Object.keys(tmpUsernames).length;
	    for(var i = 0; i < typeNames.length; i++){
		type[typeNames[i]]["others"] = (type[typeNames[i]]["others"] / (nUsers-1)).toFixed(2);
	    }
	    break;
	case "all-comparison":
	    for(var i = 0; i < mergedAnnotations.length; i++){
		var dataUsername = mergedAnnotations[i][fn_username];
		observerTypes.push(dataUsername);
	    }
	    observerTypes.sort();
	}
	
	// prepare row names of arrayColumns
	arrayColumns[0] = new Array();
	arrayColumns[0].push('x');
	if(observerType == "all" || observerType == "user-only"){
	    for(var i = 0; i < typeNames2.length; i++){
		arrayColumns[i+1] = new Array();
		arrayColumns[i+1].push(typeNames2[i]);
	    }
	} else {
	    for(var i = 0; i < observerTypes.length; i++){
		arrayColumns[i+1] = new Array();
		arrayColumns[i+1].push(observerTypes[i]);
	    }
	}

	// construct arrayColumns
	for(var i = 0; i < typeNames.length; i++){
	    // x
	    arrayColumns[0].push(typeNames[i]);

	    // observers
	    if(observerType == "all" || observerType == "user-only"){
		for(var j = 0; j < typeNames2.length; j++){
		    arrayColumns[j+1].push(type[typeNames[i]][typeNames2[j]]);
		}
	    } else {
		for(var j = 0; j < observerTypes.length; j++){
		    if(selectedAttribute == "attribute-eval-average"){
			arrayColumns[j+1].push((type[typeNames[i]][observerTypes[j]] / nType[typeNames[i]][observerTypes[j]]).toFixed(2));
		    } else {
			arrayColumns[j+1].push(type[typeNames[i]][observerTypes[j]]);
		    }
		}
	    }
	}
	flagLegend = false;
	chartType = "bar";
    } else {
	// change ui
	$("#range-slider").show();
	$("#label-timeRangeSlider").hide();
	$("#timedisplay-type-selector").show();
	$("#observer-selector").hide();
	$("#attribute-selector-summary").hide();
	$("#attribute-selector-timeline").show();

	var x = ['x'];
	var y = ['freq'];
	var temp = {};
	var categoryFreqs = {};
	var categories = {};
	var prevTime = 0;
	
	for(var i = 0; i < mergedAnnotationsCurrent.length; i++){
	    var time = Math.floor(mergedAnnotationsCurrent[i][fn_ptime]/histgramInterval/1000);
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

	chartType = "";
    }
    
    var chart = c3.generate({
	bindto: '#graph_body',
	data: {
	    x: 'x',
	    columns: arrayColumns,
	    type: chartType,
	    types: {
		freq: 'bar'
	    },
	    groups: [typeNames2],
	    order: null
	},
	axis: {
	    x: {
		type: 'category',
	    },
	    y: {
		max: maxEvaluationGrade,
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
			// selector-summary-graph
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


function accumulate(array, p1, p2, val, nArray){
    if(selectedAttribute == "attribute-eval-average"){
	// abolish invalid data
	if(isNaN(val)){
	    return;
	}

	array[p1][p2] += Number(val);

	if(p1 in nArray && p2 in nArray[p1]){
	    nArray[p1][p2]++;
	} else {
	    nArray[p1][p2] = 1;
	}
    } else {
	array[p1][p2]++;
    }
}
