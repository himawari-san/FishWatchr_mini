var now = "";
var nBoxes = 8;
var currentPageId = "home";
var pageIds = ['home', 'observation', 'graph'];
var shortcutKeys = ["q", "w", "e", "r", "t", "y", "u", "i", "o"]; // nBox <= 9
var buttonAreaRatio1 = "300px";
var buttonAreaRatio2 = "450px";
var buttonAreaRatioChange = 5; // if <=5 ratio1, otherwise ratio2 
var annotationButtonColor = "btn-outline-primary";
var annotationButtonBlinkColorDark = "btn-dark";
var annotationButtonBlinkColorLight = "btn-primary";
var annotationButtonBlinkInterval = 150;
var annotatedSpeakers = {};
var annotatedLabels = {};
var speakerList = [];
var labelList = [];
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
var defaultFilterValue = "__no_filter__";

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
var selectedFilterValue = defaultFilterValue;
var categoryYours = '_YOURS_';
var yMaxTimeLineChart = 0;

var thresholdOutlier = 1800;

var osname = getOSName();

var dataHandlingMode = "print-as-tsv";

var urlSettings = "";
var configUrlOption = "";

var cBaseTime = 0;

var startRecordingTime = 0;
var timeFilePrefix = "_sys_basetime";
var timeFileElasedType = "elapsed";
var timeFileAbsoluteType = "absolute";
var offsetTimeToPlay = 10; // sec  

var uiLanguage = window.navigator.language.slice(0, 2);
var uiLanguages = {ja: 'Japanese', en: 'English'};
var i18nUtil = new I18nUtil(uiLanguage);
var flagi18nLoaded = false;

var toolMenuItemID = "";
var groupSiteURL = "";

var startMouseDownY; // for mousedown event
var startMouseDonwTime; // for mousedown event
var moveDistanceThreshold = 25; // px
var moveDurationThreshold = 500; // msec

var hiddenVideoId = "";
var hiddenVideoIdLabel = "xxxxxxxxxxxxxxxxxxxx";
var hiddenVideoIdLabelRegExp = "^xxxxxxxxxxxx+$"; // because google's videoid length is 11
var localVideoFile = "";

var saveEventAutoSave = "auto-save";

document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("beforeunload", function(event){
	return "unload this page?";
    });

    // show home page
    changePageTo('home');
    
    startClock();
    initYoutubePlayer();
    
    console.log("document ready!!");
});


// pagecontainershow
window.addEventListener('pageshow', () => {
    initializePage();
    initializeEvent();

    console.log("osname:" + osname);
});


function changePageTo(id){

    // hide
    pageIds.forEach(pageId => {
	var page = document.getElementById(pageId);
	if(page != null && id != pageId){
	    if(pageId == currentPageId){
		processBeforeHide(pageId);		
	    }
	    page.setAttribute('hidden', '');
	}
    });

    processBeforeShow(id);

    // show
    pageIds.forEach(pageId => {
	if(id == pageId){
	    document.getElementById(pageId).removeAttribute('hidden');
	}
    });

    currentPageId = id;
}


function startClock(){
    timerID = setInterval(displayTime, timerInterval, "#current_time_home");
    console.log("new timer:" + timerID);
    annotationResults = [];
    selectedAttribute = "attribute-label";
    selectedGraph = "selector-summary-graph";
}


function loadSettings(groupname){
    if(!checkGroupname(groupname)){
	showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	return null;
    }

    var spinner = new bootstrap.Modal(document.getElementById('modal-spinner'));
    spinner.show();
    
    return fetch("get_config.php", {
	method: "POST",
	body: JSON.stringify({groupname: groupname})
    }).then((response) => response.json()).then(data => {
	var error = data.error;

	// read groupname
	groupname = data["groupname"].replace(/^ +/, "").replace(/ +$/, "");
	setValueToInput("groupname", groupname);
	
	// read labels
	data["labels"].forEach(function(value, index) {
	    setValueToInput("label" + (index+1), sanitizeJ(value));
	});
	
	// read speakers
	data["speakers"].forEach(function(value, index) {
	    setValueToInput("speaker" + (index+1), sanitizeJ(value));
	});
	
	/// set selector value
	setSelector("selector1-observation-mode", data["observation-mode"]);

	// set button text
	setInnerText("btn-load-settings",
		     i18nUtil.get("fwm-m-tab-user-set-value") + " (" + groupname + ")");

	// set auto-save option
	if(data["auto-save"]){
	    checkCheckBox("flip-auto-save");
	} else {
	    unCheckCheckBox("flip-auto-save");
	}

	// set selectedTimeStyle
	if(data["time-style"] == "elapsed-time-style" || data["time-style"] == "real-time-style"){
	    selectedTimeStyle = data["time-style"];
	}

	// set thresholdOutlier
	if(Number(data["thresholdOutlier"]) != NaN){
	    thresholdOutlier = data["thresholdOutlier"];
	}
	setValueToInput("threshold-outlier", thresholdOutlier);

	// set videoid
	if(typeof data["videoid"] === 'undefined'){
	    hiddenVideoId = "";
	    setValueToInput("video-url", "");
	} else {
	    hiddenVideoId = data["videoid"];
	    setValueToInput("video-url", hiddenVideoIdLabel);
	}

	// set group site url
	if(typeof data["groupSiteURL"] === 'undefined'){
	    groupSiteURL = "";
	} else {
	    groupSiteURL = sanitize(data["groupSiteURL"]);
	}
	updateGroupURL();
    }).catch(function (error){
	// jqm / Need to test
	showModalErrorMessage(i18nUtil.get("fwm-message-config-read-error") + "\n"+ error);
	console.log("loadSettings() failed!");
    }).finally(function(){
	spinner.hide();
	spinner.dispose();
    });
}


function initializePage() {

    // get an url option for 
    configUrlOption = location.search;

    // initialize localVideoFile and UI 
    localVideoFile = "";
    
    document.getElementById("video-url").setAttribute("type", "text"); // Web
    setValueToInput("video-url", "");
    checkRadio("radio-video-file-place-web");
    
    updateGroupURL();
    
    var urlQuery = location.search.substring(1);
    var configName = "";
    var newVideoID = "";
    
    // not support the video id with more than two queries
    for(var query of urlQuery.split("&")){
	var matches = query.match(/^(config|vid)=(.+)/);
	if(matches == null){
	    // do nothing
	} else if(matches[1] == "config"){
	    configName = matches[2];
	} else if(matches[1] == "vid"){
	    newVideoID = matches[2];
	}
    }
    
    if(configName != ""){
	var obj = loadSettings(configName);
	if(newVideoID != "" && obj != null){
	    obj.then(function(){
		// overwrite hiddenVideoId
		hiddenVideoId = newVideoID;
		eVideoUrl.setAttribute("value", hiddenVideoIdLabel);
	    });
	}
    } else if(newVideoID != ""){
	hiddenVideoId = newVideoID;
	eVideoUrl.setAttribute("value", hiddenVideoIdLabel);
    }
    
    if(flagi18nLoaded){
	changeLang();
    } else {
	i18nUtil.load(Object.keys(uiLanguages))
	    .then( function() {
		flagi18nLoaded = true;
		changeLang();
	    }).catch(function (error){
		console.log("initializePage() failed!\n" + error);
	    });
    }
}


function initializeEvent(){
    // back from the obserbation page to home
    document.getElementById('back_from_observation_to_home').addEventListener('click', function(event) {
	changePageTo('home');
    });

    // back from the graph page to home
    document.getElementById('back_from_graph_to_home').addEventListener('click', function(event) {
	changePageTo('home');
    });

    
    // push start button
    document.querySelector('#btn-start').addEventListener('click', function(event) {
	startTime = new Date();
	
	// get username
	username = getValueFromInput("username").replace(/^ +/, "").replace(/ +$/, "");
	setValueToInput("username", username);
	
	getGroupName();

	if(username == ""){
	    showModalErrorMessage(i18nUtil.get("fwm-message-username-error"));
	    return false;
	} else if(username.match(/^[A-Za-z0-9_]+$/) == null){
	    showModalErrorMessage(i18nUtil.get("fwm-message-invalid-username-error"));
	    return false;
	} else if(!checkGroupname(groupname) && groupname != ""){
	    showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	    return false;
	}

	changePageTo('observation');
    });


    // push #btn-get-archive
    document.querySelector('#btn-get-archive').addEventListener('click', function(event) {
	// get groupname
	groupname = getValueFromInput("groupname").replace(/^ +/, "").replace(/ +$/, "");
	setValueToInput("groupname",  groupname);
	groupname = groupname.replace(/\$$/, "");
	
	if(groupname == ""){
	    showModalErrorMessage(i18nUtil.get("fwm-message-no-groupname-error"));
	    return false;
	} else if(groupname.match(/^[A-Za-z0-9_]+$/) == null){
	    showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	    return false;
	}
	
	var dataBody = "";
	var fileType = "";
	
	fetch("archive.php", {
	    method: "POST",
	    body: JSON.stringify({
		groupname: groupname
	    })
	}).then((response) => response.json()).then(data => {
	    document.getElementById("resultDataURLZIP").href = data.result_url;
	    showModalDialog("showGroupDataUrl");
	}).catch(function (error){
	    showModalErrorMessage("archive.php failed!\n" + error);
	    console.log("archive.php failed!\n" + error);
	});
    });
    
    
    // tool menu 
    // * #toolMenuItemSaveSettings 
    document.querySelector('#toolMenuItemSaveSettings').addEventListener('click', function(event) {
	saveSettings();
    });

    
    // * #toolMenuItemRecordCurretTime
    document.querySelector('#toolMenuItemRecordCurretTime').addEventListener('click', function(event) {
	getCurrentStartRecordingTime();
	// set default date, that is the current time
	setValueToInput("textinput-time", date2FormattedDateTime(new Date(), false));
	showModalDialog('popup-record-time');
    });


    // ** #record-time-button-id-ok in #toolMenuItemRecordCurretTime
    document.querySelector('#record-time-button-id-ok').addEventListener('click', function(event) {
	
	var selectedID = document.querySelector('[name="radio-choice-time-info"]:checked').id;
	var fileType = isChecked("checkbox-input-time-option") ? timeFileElasedType : timeFileAbsoluteType;
	
	if(selectedID == "radio-choice-time-info-current"){
	    saveCurrentTime(new Date(), fileType);
	} else if(selectedID == "radio-choice-time-info-manual") {
	    var inputDate = parseDate(getValueFromInput("textinput-time"));
	    if(inputDate != NaN){
		saveCurrentTime(new Date(inputDate), fileType);
	    } else {
		showModalErrorMessage(i18nUtil.get("fwm-m-record-time-warning")
				 + "\n"
				 + i18nUtil.get("fwm-m-record-time-example"));
	    }
	}
    });
    

    // * #toolMenuItemSetGroupSiteURL
    document.querySelector('#toolMenuItemSetGroupSiteURL').addEventListener('click', function(event) {
	showModalDialog("popup-set-group-site-url");
    });

    
    document.querySelector('#popup-set-group-site-url-ok').addEventListener('click', function(event) {
	groupSiteURL = sanitize(getValueFromInput("group-site-url"));
	updateGroupURL();
    });
    
    
    document.querySelector('#toolMenuItemShowQrCode').addEventListener('click', function(event) {
	getGroupName();
	if(checkGroupname(groupname)){
	    var groupURL = location.protocol + "//" 
		+ location.host 
		+ location.pathname.replace(/\.html.+/, ".html")
		+ "?config=" + groupname;

	    setInnerText("qrcode-group-url", "");
	    var qrcode = new QRCode(document.getElementById('qrcode-group-url'),
				    {width: 256, height: 256});
	    qrcode.clear();
	    qrcode.makeCode(groupURL);

	    var link = document.getElementById("url-group-settings");
	    link.href = groupURL;
	    link.innerText = groupname;

	    showModalDialog("popup-show-qrcode");
	} else {
	    if(groupname != ""){
		showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	    } else {
		showModalErrorMessage(i18nUtil.get("fwm-message-no-groupname-error"));
	    }
	}
    });


    // draw charts
    document.querySelector('#btn-show-graph').addEventListener('click', function(event) {
	thresholdOutlier = getValueFromInput("threshold-outlier");
	getGroupName();
	
	if(thresholdOutlier == ""){
	    thresholdOutlier = Number.MAX_VALUE;
	} else if(isNaN(thresholdOutlier) || thresholdOutlier < 0){
	    showModalErrorMessage(i18nUtil.get("fwm-message-invalid-threshold-error"));
	    return false;
	} else if(!checkGroupname(groupname)){
	    showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	    return false;
	} else {
	    thresholdOutlier *= 1000; // milisec
	}

	changePageTo('graph');
    });


    document.querySelectorAll('.graph-selector').forEach(selector => {
	selector.addEventListener('click', function(event) {
	    selectedGraph = event.target.id;
	    drawGraph();
	});
    });


    // selectors in summary-graph-panel
    document.querySelector('#summary-graph-attribute-selector').addEventListener('change', function(event) {
	selectedAttribute = event.target.value;
	drawGraph();
	// update timeline-graph-panel
	if(selectedAttribute == 'attribute-observation-target'){
	    document.getElementById('time-line-attribute-observation-target').click();
	} else {
	    document.getElementById('time-line-attribute-label').click();
	}
    });

    document.querySelector('#observer-selector').addEventListener('change', function(event) {
	selectedObserver = event.target.value;
	drawGraph();
    });


    // selectors in timeline-graph-panel
    document.querySelectorAll('.time-line-attribute-selector').forEach(selector => {
	selector.addEventListener('click', function(event) {
	    selectedAttribute = event.target.value;
	    updateAttributeFilter();
	    drawGraph();
	    // update summary-graph-panel
	    setSelector("summary-graph-attribute-selector", selectedAttribute);
	});
    });

    
    document.querySelectorAll('.time-style-selector').forEach(selector => {
	selector.addEventListener('click', function(event) {
	    selectedTimeStyle = event.target.value;
	    changeTimeStyle();
	    drawGraph();
	});
    });


    document.querySelector('#time-interval-selector').addEventListener('change', function(event) {
	histgramInterval = event.target.value;
	yMaxTimeLineChart = 0;
	drawGraph();
    });


    document.querySelector('#attribute-value-selector').addEventListener('change', function(event) {
	selectedFilterValue = event.target.value;
	drawGraph();
    });

    
    // language selector
    document.querySelectorAll('.fw-lang-item').forEach(item => {
	item.addEventListener('click', function(event) {
	    uiLanguage = event.target.id.replace(/^lang-item-/, "");
	    changeLang();
	});
    });


    document.querySelector('#popup-set-url-ok').addEventListener('click', function(event) {
	var modalElement = document.getElementById('popup-set-url');
	var modal = bootstrap.Modal.getInstance(document.getElementById('popup-set-url'));
	var configName = getValueFromInput("urlSettings");
	if(configName == ""){
	    showModalErrorMessage(i18nUtil.get("fwm-message-specify-url"));
	} else {
	    loadSettings(configName);
	}
    });
    
    
    document.querySelector('#btn-watch-video').addEventListener('click', function(event) {
	var videoID = getVideoID();
	
	if(videoID == ""){
	    showModalMessage(i18nUtil.get("fwm-message-no-videoid-error"),
			     i18nUtil.get("fwm-m-title-error"));
	} else {
            initVideoPlayer('video-player1', '#close-video', 0);
	    showModalDialog("watch-video");
	}
    });
    
    
    document.querySelector('#video-url').addEventListener('change', function(event) {
	if(eGeAttribute("video-url", "type") == "file"){
	    localVideoFile = URL.createObjectURL(this.files[0]);
	}
    });


    document.querySelectorAll('[name="radio-video-file-place"]').forEach(radio => {
	radio.addEventListener('click', function(event) {
	    var videoFilePlace = event.target.id;
	    var videoUrlForm = document.getElementById("video-url");
	    
	    if(videoFilePlace == "radio-video-file-place-web"){
		videoUrlForm.setAttribute("type", "text");
	    } else { // Local
		videoUrlForm.setAttribute("type", "file");
	    }
	});
    });

    
    // * .process-selection-item
    document.querySelectorAll('.process-selection-item').forEach(anchor => {
	anchor.addEventListener('click', function(event) {
	    var selectedProcessID = event.target.id;
	    
	    if(selectedProcessID == "save-as-tsv" || selectedProcessID == "save-as-xml"){
		event.target.click();
	    } else if(selectedProcessID == "print-as-tsv"){
		showModalMessage(getAnnotationsAsText(),
				 i18nUtil.get("fwm-m-title-observation-data"));
	    } else if(selectedProcessID == "print-as-xml"){
		showModalMessage(getAnnotationsAsXML(),
				 i18nUtil.get("fwm-m-title-observation-data"));
	    } else if(selectedProcessID != ""){
		saveToServer(selectedProcessID);
	    }
	});
    });
    
    
    //
    // observation page
    //
    //
    // if detect change of select menu, then update annotation buttons
    document.querySelector('#selector2-observation-mode').addEventListener("change", function () {
	annotationMode = getValueFromInput("selector2-observation-mode");
	
	var ca = 1;
	var cb = 1;
	
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    var v = annotatedSpeakers[pn];
	    
	    if(v != undefined && v != ""){
		var targetID = "bt_speaker" + ca;
		var button = document.getElementById(targetID);
		
		if(annotationMode == "mode_label"){
		    button.disabled = true;
		} else {
		    button.disabled = false;
		}
		ca++;
	    } 
	    
	    pn = "label" + i;
	    v = annotatedLabels[pn];
	    if(v != undefined && v != ""){
		var targetID = "bt_label" + cb;
		var button = document.getElementById(targetID);
		
		if(annotationMode == "mode_speaker"){
		    button.disabled = true;
		} else {
		    button.disabled = false;
		}
		cb++;
	    } 
	}
    });

    
    // delete buttons in the annotation list
    document.querySelectorAll('.disp-button-delete').forEach(button => {
	button.addEventListener('click', function(event) {
	    var deletedTargetID = event.target.localName == 'button'
		? event.target.id // button
		: event.target.parentNode.id; // img
	    var iEnd = annotationResults.length - 1;

	    if(deletedTargetID == "disp-button1"){
		if(iEnd >= 0) {
		    annotationResults.splice(iEnd, 1);
		    displayResults();
		    return;
		}
	    } else if(deletedTargetID == "disp-button2"){
		if(iEnd >= 1) {
		    annotationResults.splice(iEnd-1, 1);
		    displayResults();
		    return;
		}
	    }
	});
    });
}


function showModalDialog(id){
    var dialog = new bootstrap.Modal(document.getElementById(id));
    dialog.show();
}


function showModalMessage(message, title){
    var eMessage = document.getElementById('modal-message-dialog-body');
    var eTitle = document.getElementById('modal-message-dialog-title');
    
    eMessage.innerText = message;
    eTitle.innerText = title;
    showModalDialog('modal-message-dialog');
}


function showModalErrorMessage(message){
    showModalMessage(message, i18nUtil.get("fwm-m-title-error"));
}


function updateAttributeFilter(){
    var categories = selectedAttribute == 'attribute-label' ? labelList : speakerList; 
    var defaultFilterText = i18nUtil.get("fwm-m-graph-attribute-value-selector-default");

    var avs = document.getElementById("attribute-value-selector");
    var newItem = document.createElement("option");
    avs.innerText = "";
    newItem.value = defaultFilterValue;
    newItem.innerText = defaultFilterText;
    avs.appendChild(newItem);
    for(var i = 0; i < categories.length; i++){
	newItem = document.createElement("option");
	newItem.value = categories[i];
	newItem.innerText = categories[i];
	avs.appendChild(newItem);
    }
    selectedFilterValue = defaultFilterValue;
}


function changeLang(){

    i18nUtil.setLocale(uiLanguage);

    // element with "data-i18n" attribute 
    document.querySelectorAll('[data-i18n]').forEach(element => {
	element.innerText = i18nUtil.get(element.getAttribute('data-i18n'));
    });

    // label for language selector
    setInnerText('navbarDropdownMenuLink', uiLanguage);

    // placefolder of username form     
    document.getElementById("username").setAttribute("placeholder", i18nUtil.get("fwm-m-label-placeholder"));

    // load-setting button
    var buttonLoadSettings = document.getElementById("btn-load-settings");
    var found = buttonLoadSettings.innerText.match(/^.+(\(.+\))$/);
    if(found){
	buttonLoadSettings.innerText = i18nUtil.get("fwm-m-tab-user-set-value") + " " + found[1];
    } else {
	buttonLoadSettings.innerText = i18nUtil.get("fwm-m-tab-user-empty-value");
    }

    // button setting tab
    for(i = 1; i <= 8; i++){
	document.getElementById("label" + i).setAttribute("placeholder", i18nUtil.get("fwm-m-button-label"));
	document.getElementById("speaker" + i).setAttribute("placeholder", i18nUtil.get("fwm-m-button-target"));
    }
}


function processBeforeHide(pageId){
    if(pageId == "home"){
	// get username
	username = getValueFromInput("username").replace(/^ +/, "").replace(/ +$/, "");
	setValueToInput("username", username);
	
	// get groupname
	getGroupName();

	// get values of speakers and labels
	speakerList = [];
	labelList = [];
	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    annotatedSpeakers[pn] = sanitizeJ(getValueFromInput(pn));
	    if(annotatedSpeakers[pn] != ""){
		speakerList.push(annotatedSpeakers[pn]);
	    }

	    pn = "label" + i;
	    annotatedLabels[pn] = sanitizeJ(getValueFromInput(pn));
	    if(annotatedLabels[pn] != ""){
		labelList.push(annotatedLabels[pn]);
	    }
	}

	// get annotation mode
	annotationMode = getSelectedValue("selector1-observation-mode");
    } else if(pageId == "observation"){
	console.log("observation page closed!!");
	// save annotations to annotationStorage
	var newdata = {starttime:startTime, username:username, annotations:annotationResults.concat()};
	annotationStorage.push(newdata);
	updateSavenameList();

	if(isChecked("flip-auto-save")){
	    saveToServer(saveEventAutoSave);
	    console.log("auto-save");
	} else {
	    console.log("no auto-save");
	}
    }
}



function processBeforeShow(pageId){
    if(timerID != -1){
	clearInterval(timerID);
	console.log("timer cleared:" + timerID);
    }

    removeShortcutAll();
    
    // observation page
    if(pageId == "observation"){
	var panelA = document.getElementById('panel-a');
	var panelB = document.getElementById('panel-b');

	// start new timer
	timerID = setInterval(displayElapsedTime, timerInterval, "#current_time_observation");

	// display username
	setInnerText('current_username', username);

	// panel initialization
	panelA.textContent = '';
	panelB.textContent = '';

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
	    panelA.setAttribute('style', "height:" + buttonAreaRatio2);
	    panelB.setAttribute('style', "height:" + buttonAreaRatio2);
	} else {
	    panelA.setAttribute('style', "height:" + buttonAreaRatio1);
	    panelB.setAttribute('style', "height:" + buttonAreaRatio1);
	}


	// set button names
	var ca = 1;
	var cb = 1;

	var shortcutCallback = (function (button) {
	    return function () {
		if(!button.disabled){
		    blinkButtonLightly(button);
		    // Dispatch a mousedown and mouseup event, 
		    // because click() doesn't.
		    button.dispatchEvent(new MouseEvent("mousedown"));
		    button.dispatchEvent(new MouseEvent("mouseup"));
		}
	    };
	});
	

	for(var i = 1; i <= nBoxes; i++){
	    var pn = "speaker" + i;
	    var v = annotatedSpeakers[pn];
	    
	    if(v != undefined && v != ""){
		var newID = "bt_speaker" + ca;
		var newButton = document.createElement("button");
		newButton.setAttribute("class", "btn btn-annotation w-100 m-1 " + annotationButtonColor);
		newButton.setAttribute("id", newID);
		newButton.setAttribute("type", "button");
		newButton.setAttribute("style", "height:" + buttonHeightRatio[na-1]);
		newButton.innerText = v;
		panelA.appendChild(newButton);

		if(annotationMode == "mode_label"){
		    newButton.disabled = true;
		}
		shortcut.add(shortcutKeys[ca-1], shortcutCallback(newButton));
		addEventListerToAnnotationButton(newButton);
		ca++;
	    } 

	    pn = "label" + i;
	    v = annotatedLabels[pn];
	    if(v != undefined && v != ""){
		var newID = "bt_label" + cb;
		var newButton = document.createElement("button");
		newButton.setAttribute("class", "btn btn-annotation w-100 m-1 " + annotationButtonColor);
		newButton.setAttribute("id", newID);
		newButton.setAttribute("type", "button");
		newButton.setAttribute("style", "height:" + buttonHeightRatio[nb-1]);
		newButton.innerText = v;
		panelB.appendChild(newButton);
		if(annotationMode == "mode_speaker"){
		    newButton.disabled = true;
		}
		shortcut.add(cb + "", shortcutCallback(newButton));
		addEventListerToAnnotationButton(newButton);
		cb++;
	    } 
	}

	// update ui of annotation list
	displayResults();
	
	// initialize selectmenu
	setSelector("selector2-observation-mode", annotationMode);
    } else if(pageId == "home"){
	timerID = setInterval(displayTime, timerInterval, "#current_time_home");
	console.log("new timer:" + timerID);
	annotationResults = [];
	selectedAttribute = "attribute-label";
	selectedGraph = "selector-summary-graph";
	selectedObserver = "all";
	histgramInterval = 60;
	selectedTimeStyle = 'real-time-style';
    } else if(pageId == "graph"){
	// jqm confirm pagenontainershow
	generateGraph();

	// click a tab to select summary-graph or timeline-graph
	document.getElementById(selectedGraph).click();

	//
	// #summary-graph-panel
	//
	setSelector("summary-graph-attribute-selector", selectedAttribute);
	setSelector("observer-selector", selectedObserver);

	//
	// # time-line-panel
	//
	setSelector("time-interval-selector", histgramInterval);

	if(selectedAttribute == 'attribute-observation-target'){
	    document.querySelector('#time-line-attribute-observation-target').checked = 'true';
	} else {
	    document.querySelector('#time-line-attribute-label').checked = 'true';
	}
	if(selectedTimeStyle == 'real-time-style'){
	    document.querySelector('#real-time-style').checked = 'true';    
	} else {
	    document.querySelector('#elapsed-time-style').checked = 'true';    
	}
	updateAttributeFilter();
	
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

	drawGraph();
    }
};


function addEventListerToAnnotationButton(button) {
    // push an annotation button down
    button.addEventListener('mousedown', function(event) {
	startMouseDownY = event.pageY;
	startMouseDonwTime = performance.now();
    });

    
    // release an annotation button
    button.addEventListener('mouseup', function(event) {
	var buttonID = event.target.id;
	
	// cancel the event when the observation screen is scrolled
	if(Math.abs(event.pageY - startMouseDownY) > moveDistanceThreshold
	   || performance.now() - startMouseDonwTime > moveDurationThreshold){
	    // stop focusing on the button
	    this.blur();
	    return false;
	}
	
	var now = new Date();
	var currentTime = date2FormattedDateTime(now, 1);
	var elapsedTime = time2FormattedTime(now.getTime() - startTime.getTime(), 1);
	var annotation = "";
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
	blinkButtonDarkly(this);
	tempAnnotationSpeaker = "-";
	tempAnnotationLabel = "-";
    });
}


function blinkButton(button, normalColor, blinkColor){
    button.classList.remove(normalColor);
    button.classList.add(blinkColor);
    setTimeout(function () {
	button.classList.remove(blinkColor);
	button.classList.add(normalColor);
    }, annotationButtonBlinkInterval);
}


function blinkButtonDarkly(button){
    blinkButton(button, annotationButtonColor, annotationButtonBlinkColorDark);
}

function blinkButtonLightly(button){
    blinkButton(button, annotationButtonColor, annotationButtonBlinkColorLight);
}




function saveSettings(){
    var eGroupname = document.getElementById("groupname");
    var trueGroupname = eGroupname.value.replace(/^ +/, "").replace(/ +$/, "");
    eGroupname.value = trueGroupname;

    if(trueGroupname.match(/\$$/)){
	trueGroupname = trueGroupname.replace(/\$$/, "");
	
	if(!checkGroupname(trueGroupname)){
	    showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	    return false;
	}
    } else {
	showModalErrorMessage(i18nUtil.get("fwm-message-permission-error"));
	return false;
    }

    var currentVideoId = getVideoID();
    if(currentVideoId.match(/^blob:/)){
	currentVideoId = ""; // save no videoID
    } 
    if(getValueFromInput("video-url").match(new RegExp(hiddenVideoIdLabelRegExp))){
	showModalErrorMessage(i18nUtil.get("fwm-message-invalid-videoid-error"));
	return false;
    }

    var speakers = [];
    var labels = [];
    var mode = getSelectedValue("selector1-observation-mode");
    var auto_save = isChecked("flip-auto-save");
    var currentThresholdOutlier = getValueFromInput("threshold-outlier");

    for(var i = 1; i <=8; i++){
	speakers.push(getValueFromInput("speaker" + i));
	labels.push(getValueFromInput("label" + i));
    }

    var settingsJSON = {
	"groupname": trueGroupname,
	"speakers": speakers,
	"labels": labels,
	"observation-mode": mode,
	"auto-save": auto_save,
	"time-style": selectedTimeStyle,
	"thresholdOutlier" : currentThresholdOutlier,
	"videoid" : currentVideoId,
	"groupSiteURL" : groupSiteURL
    };

    fetch("save_settings.php", {
	method: "POST",
	body: JSON.stringify({
	    savename: trueGroupname,
	    databody: settingsJSON
	})
    }).then((response) => response.json()).then(data => {
	var error = data.error;
	if(error == "already_exists") {
	    showModalErrorMessage(i18nUtil.get("fwm-message-group-already-exist-error"));
	} else if(error == "fail_to_copy" || error == "fail_to_save") {
	    showModalErrorMessage(i18nUtil.get("fwm-message-server-error") + "\n" + error);
	} else {
	    showModalMessage(i18nUtil.get("fwm-message-config-save-complete"),
			     i18nUtil.get("fwm-js-title-save-complete"));
	}
    }).catch(function (error){
	showModalErrorMessage("saveSettings() failed!\n" + error);
	console.log("saveSettings() failed!\n" + error);
    });
}


function saveCurrentTime(newStartTime, timeFileType){
    var newname = timeFilePrefix;
    var dummyResults = [];

    var eGroupname = document.getElementById("groupname");
    var trueGroupname = eGroupname.value.replace(/^ +/, "").replace(/ +$/, "");
    eGroupname.value = trueGroupname;
    
    if(trueGroupname.match(/\$$/)){
	trueGroupname = trueGroupname.replace(/\$$/, "");
	
	if(!checkGroupname(trueGroupname)){
	    showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	    return false;
	} else {
	    newname += "_" + cBaseTime + "_" + timeFileType;
	    cBaseTime++;
	}
    } else {
	showModalErrorMessage(i18nUtil.get("fwm-message-permission-error"));
	return false;
    }

    var newdata = {starttime:newStartTime, username:newname, annotations:dummyResults.concat()};
    annotationStorage.push(newdata);
    updateSavenameList();

    if(document.getElementById("flip-auto-save").checked){
	// auto-save
	saveToServer(saveEventAutoSave);
    } else {
	showModalMessage(i18nUtil.get("fwm-message-save-time-info")
			 + newname + "/"
			 + date2FormattedDateTime(newStartTime).replace(/-/g, ""),
			 i18nUtil.get("fwm-title-save-time-info"));
    }
};


function saveToServer(event){
    if(event == saveEventAutoSave){
	// when auto-save
	iAnnotationStorage = annotationStorage.length-1;
    }
    
    // get savename
    var savename = document.getElementById("savename_" + iAnnotationStorage).innerText;
    savename = savename.replace(":", "").replace("/", "_").replace(" ", "_");

    // get groupname
    getGroupName();
    
    if(!checkGroupname(groupname)){
	showModalErrorMessage(i18nUtil.get("fwm-message-groupname-error"));
	return false;
    }

    var resultURLText = "#";
    var resultURLXML = "#";
    store(savename, groupname, "txt", getAnnotationsAsText())
	.then((response) => response.json())
	.then(data => {
	    resultURLText = data.result_url;
	})
	.catch(function (error){
	    console.log("saveToServer() failed!\n" + error);
	});
    store(savename, groupname, "xml", getAnnotationsAsXML())
	.then((response) => response.json())
	.then(data => {
	    resultURLXML = data.result_url;
	    document.getElementById("resultDataURLText").href = resultURLText;
	    document.getElementById("resultDataURLXML").href = resultURLXML;
	    showModalDialog("showDataUrl");
	})
	.catch(function (error){
	    console.log("saveToServer() failed!\n" + error);
	});
}


function store(savename, groupname, fileType, dataBody){
    return fetch("store.php", {
	method: "POST",
	body: JSON.stringify({
	    savename: savename,
	    groupname: groupname,
	    fileType: fileType,
	    databody: dataBody
	})
    });
}




function updateGroupURL(){
    if(groupSiteURL == ""){
	document.getElementById("liShowGroupSite").setAttribute("hidden", "");
    } else {
	document.getElementById("liShowGroupSite").removeAttribute("hidden");
    }
    document.getElementById("group-site-url").setAttribute("value", groupSiteURL);
    document.getElementById("show-group-site").setAttribute("href", groupSiteURL);
}


class VideoPlayer {
    constructor(name, videoID, startSeconds){
	this.name = name;
	this.videoID = videoID;
	this.startSeconds = startSeconds;
    }
}


class YouTubeVideoPlayer extends VideoPlayer {
    constructor(name, videoID, startSeconds){
	super(name, videoID, startSeconds);
	this.type = "youtube";
	this.player = new YT.Player(this.name, {
	    height: '100%',
	    width: '100%',
	    playerVars: {'playsinline':1}, // prevent from becoming fullscreen 
	    videoId: '',
	    //	playerVar: 'origin=http://localhost',
	    events: {
//		'onReady': this.onReady
	    }
	});
    }

    init(){
	var videoID = this.videoID;
	var startSeconds = this.startSeconds;
	this.player.addEventListener('onReady', function(event){
	    event.target.cueVideoById({
		videoId: videoID,
		startSeconds: startSeconds
	    });
	});
    }

    stop(){
	if(this.player != null){
	    this.player.stopVideo();
	    this.player.destroy();
	    this.player = null;
	}
    }
}


class HTML5VideoPlayer extends VideoPlayer {
    constructor(name, videoID, startSeconds){
	super(name, videoID, startSeconds);
	this.type = "html5";
	var eDiv = document.getElementById(this.name);
	eDiv.innerText = ""; // remove div

	var eVideo = document.createElement('video');
	eVideo.id = this.name + this.type;
	eVideo.preload = "auto";
	// use setAttribute instead of property. I don't know why
	eVideo.setAttribute("width", "100%"); 
	eVideo.setAttribute("height", "auto");
	eVideo.src = this.videoID;
	eVideo.controls = true;

	eDiv.appendChild(eVideo);
	this.player = document.getElementById(this.name + this.type);
    }

    init(){
	// This method is for Safari/iOS.
	// In Firefox/Linux, simply write in the constructor as follows:
	// this.player.currentTime = this.startSeconds
	var player = this.player;
	var startSeconds = this.startSeconds;
	this.player.addEventListener('loadeddata', function(event){
	    player.currentTime = startSeconds;
	}, {once: true});
    }

    stop(){
	if(this.player != null){
	    this.player.pause();
	    document.getElementById(this.name).innerText = "";
	}
    }
}




function initYoutubePlayer() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}


function initVideoPlayer(playerName, closeButtonId, startSeconds){
    var player = null;
    var videoID = getVideoID();

    if(!isVideoID()) {
	player = new HTML5VideoPlayer(playerName, videoID, startSeconds);
    } // youtube
    else {
	player = new YouTubeVideoPlayer(playerName, videoID, startSeconds);
    }
    player.init();

    document.querySelector(closeButtonId).addEventListener('click', function(event){
	player.stop();
    });
}


function isVideoID(){
    var videoID = getVideoID();

    if(videoID.match(/^https?:\/\//) || videoID.match(/^blob:/)) {
	return false;
    } else {
	return true;
    }
}


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


function getGroupName(){
    var eGroupname = document.getElementById("groupname");
    groupname = eGroupname.value.replace(/^ +/, "").replace(/ +$/, "");
    eGroupname.value =  groupname;
    groupname = groupname.replace(/\$$/, "");
}


function removeShortcutAll(){
    for(var sc in shortcut.all_shortcuts){
	shortcut.remove(sc);
    }
}


function updateSavenameList(){
    var nMax = 5;
    var savenameList = document.getElementById("savename-list");
    // clear
    savenameList.innerText = "";

    for(var i = 0; i < nMax; i++){
	var j = annotationStorage.length - i;
	
	var newItem = document.createElement("button");
	newItem.classList.add("list-group-item");
	newItem.classList.add("list-group-item-action");
	newItem.classList.add("py-2");

	if(j > 0){
	    var newUsername = annotationStorage[i].username == "" ?
		"noname" :
		annotationStorage[i].username;
	    newItem.innerText = newUsername + "/" +
		date2FormattedDateTime(annotationStorage[i].starttime).replace(/-/g, "");
	    newItem.id = "savename_" + i;
	    newItem.addEventListener('click', function(event) {
		iAnnotationStorage = event.target.id.match(/\d+$/)[0];
		
		// txt
		var blobTxt = getAnnotationsAsBlob ("text/plain");
		eSetAttribute("save-as-tsv", "download", "fw_mini_" + username + ".txt");
		eSetAttribute("save-as-tsv", "href", URL.createObjectURL(blobTxt));
		
		// xml
		var blobXML = getAnnotationsAsBlob ("text/xml");
		eSetAttribute("save-as-xml", "download", "fw_mini_" + username +  ".xml");
		eSetAttribute("save-as-xml", "href", URL.createObjectURL(blobXML));

		showModalDialog("popup-select-process");
	    });
	} else {
	    newItem.innerText = i18nUtil.get("fwm-no-saved-data");
	}

	savenameList.appendChild(newItem);
    }
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
    if(time < 0){
	return "00:00:00";
    }

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
    var matches = ftime.match(/^(\d\d):(\d\d):(\d\d)(\.(\d\d\d))?/);
    var result = -1;
    
    if(matches != null){
	result = matches[1] * 1000 * 3600
	    + matches[2] * 1000 * 60
	    + matches[3] * 1000;
	if(matches[4] != undefined){
	    result += (matches[5]*1);
	}
    }

    return result;
}


function parseDate(strDate){
    var matches = strDate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)\s+(\d\d):(\d\d):(\d\d)(\.(\d\d\d))?/);
    var time = NaN;

    if(matches != null){
	var newDate = new Date();

	newDate.setFullYear(matches[1], matches[2] - 1, matches[3]);
	newDate.setHours(matches[4], matches[5], matches[6]);
	if(matches[7] != undefined){
	    newDate.setMilliseconds(matches[8]);
	}
	
	time = newDate.getTime();
    }
    
    return time;
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
	    setInnerText("disp" + i, i18nUtil.get("fwm-no-annotation-data"));
	} else {
	    setInnerText("disp" + i, annotationResults[p--]);
	}
    }
}


function getAnnotationsAsText(){

    if(iAnnotationStorage < 0) return;

    var result = "";
    for (var v of annotationStorage[iAnnotationStorage].annotations){
	result += v + "\n";
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


function getVideoID(){
    var videoID = $('#video-url').attr('type') == "file" ?  localVideoFile : sanitize($("#video-url").val());
    if(videoID.match(new RegExp(hiddenVideoIdLabelRegExp))){
	return hiddenVideoId;
    } else {
	return videoID;
    }
}


function getCurrentStartRecordingTime(){
    getGroupName();
    if(groupname == ""){
	$("#currentStartRecordingTime").text(i18nUtil.get("fwm-m-record-current-recording-time-undefined"));
	return;
    }

    // jqm confirm
    $.ajax({
	url: "get_merged_data.php",
	type: "post",
	dataType: "text",
	beforeSend: function(jqXHR, settings) {
	    $("#currentStartRecordingTime").text(i18nUtil.get("fwm-m-record-current-recording-time-loading"));
	},
	data: {
	    groupname: groupname,
	    timefile: timeFilePrefix
	},
    }).done(function(data) {
	var arrayAnnotations = data.split("\n");
	var currentStartRecordingTime = 0;
	var annotations = new Array();
	var timeFileType = ""; // absolute
	
	// get start-recording-time
	if(arrayAnnotations.length != 0){
	    var matches = arrayAnnotations[0].match(new RegExp("^" + timeFilePrefix + "\t(.+)\t(.+)"));
	    if(matches != null){
		// arrayAnnotations[0]: _sys_basetime \t basetime \t filetype
		if(matches[2] == "elapsed"){
		    timeFileType = "<br/>(" + i18nUtil.get("fwm-m-record-time-input-option") + ")";
		}
		// get and remove a time information record
		currentStartRecordingTime = parseDate(matches[1]);
		arrayAnnotations.shift();
	    }
	}
	
	for(var i = 0; i < arrayAnnotations.length; i++){
	    if(arrayAnnotations[i] == "") continue;
	    var arrayFields = arrayAnnotations[i].split("\t");
	    arrayFields.push(parseDate(arrayFields[fn_ctime]));
	    annotations[i] = arrayFields;
	}
	
	// sort by date
	annotations.sort(function(a, b){
	    if(a[fn_ptime] < b[fn_ptime]){
		return -1;
	    } else {
		return 1;
	    }
	});

	// startRecordingTime is the time of the first record, if no time information record
	if(currentStartRecordingTime == 0 && annotations.length > 0){
	    currentStartRecordingTime = annotations[0][fn_ptime];
	}

	if(currentStartRecordingTime == 0){
	    $("#currentStartRecordingTime").text(i18nUtil.get("fwm-m-record-current-recording-time-undefined"));
	} else {
	    $("#currentStartRecordingTime")
		.html(date2FormattedDateTime(new Date(currentStartRecordingTime)) + timeFileType);
	}
    }).fail(function (jqXHR, textStatus){
	console.log("hey fail");
	$("#currentStartRecordingTime").text(i18nUtil.get("fwm-m-record-current-recording-time-fail"));
    });
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
    yMaxTimeLineChart = 0;
    
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
	var flagElapsedTimeFile = false;

	// get start-recording-time
	if(arrayAnnotations.length != 0){
	    var matches = arrayAnnotations[0].match(new RegExp("^" + timeFilePrefix + "\t(.+)\t(.+)"));
	    if(matches != null){
		// arrayAnnotations[0]: _sys_basetime \t basetime \t filetype
		if(matches[2] == "elapsed"){
		    flagElapsedTimeFile = true;
		}
		// get and remove a time information record
		startRecordingTime = parseDate(matches[1]);
		arrayAnnotations.shift();
	    }
	}
	
	for(var i = 0; i < arrayAnnotations.length; i++){
	    if(arrayAnnotations[i] == "") continue;
	    var arrayFields = arrayAnnotations[i].split("\t");

	    if(flagElapsedTimeFile){
		arrayFields[fn_ptime] =
		    startRecordingTime + 
		    formattedTime2Sec(arrayFields[fn_etime]);
		arrayFields[fn_ctime] = date2FormattedDateTime(new Date(arrayFields[fn_ptime]), true);
	    } else {
		arrayFields[fn_ptime] = parseDate(arrayFields[fn_ctime]);
	    }
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
    var iAttribute2;
    var buttonList;
    var buttonList2;
    if(selectedAttribute == 'attribute-label'){
	iAttribute2 = fn_speaker;
	buttonList = labelList;
	buttonList2 = speakerList;
    } else {
	iAttribute2 = fn_label;
	buttonList = speakerList;
	buttonList2 = labelList;
    }
    var observerType = getSelectedValue("observer-selector");
    var maxEvaluationGrade = undefined;
    var typesJSON = {};
    
    if(selectedGraph == 'selector-summary-graph'|| selectedGraph == ""){
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

	// sort typeName and typeName2 with button-order
	typeNames.sort(function(a, b){
	    if(buttonList.indexOf(a) == -1 && buttonList.indexOf(b) == -1){
		return a < b ? -1 : 1;
	    } else {
		return buttonList.indexOf(a) - buttonList.indexOf(b);
	    }
	});
	typeNames2.sort(function(a, b){
	    if(buttonList2.indexOf(a) == -1 && buttonList2.indexOf(b) == -1){
		return a < b ? -1 : 1;
	    } else {
		return buttonList2.indexOf(a) - buttonList2.indexOf(b);
	    }
	});

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
	console.log("ma:" + mergedAnnotationsCurrent.length);
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
	var x = ['x'];
	var y = ['freq'];
	var temp = {};
	var temp2 = {};
	var categoryFreqs = {};
	var categoryFreqs2 = {};
	var categories = {};
	var categories2 = {};
	var prevTime = 0;

	for(var i = 0; i < mergedAnnotationsCurrent.length; i++){
	    var ptime = mergedAnnotationsCurrent[i][fn_ptime];
	    // remove annotations that are made before recording the video
	    if(ptime - startRecordingTime < 0){
		continue;
	    }

	    var time = Math.floor(ptime/histgramInterval/1000);
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


	    // add '-' to buttonList, buttonList2 and categories
	    if(category == '-') {
		if(buttonList.indexOf(category) == -1){
		    buttonList.push(category);
		}
		for(var j = 0; j < buttonList.length; j++){
		    if(!(buttonList[j] in categories)){
			categories[buttonList[j]] = 0;
		    }
		}
	    }
	    if(mergedAnnotationsCurrent[i][iAttribute2] == '-' && buttonList2.indexOf('-') == -1) {
		buttonList2.push('-');
	    }
	    

	    // filter
	    if(selectedFilterValue != defaultFilterValue && selectedFilterValue != mergedAnnotationsCurrent[i][iAttribute]){
		if(type[time] == undefined) type[time] = 0;
		if(temp[category + "\t" + time] == undefined) temp[category + "\t" + time] = 0;
		if(username == mergedAnnotationsCurrent[i][fn_username] && temp[categoryYours + "\t" + time] == undefined){
		    temp[categoryYours + "\t" + time] = 0;
		}
		if(temp2[mergedAnnotationsCurrent[i][iAttribute2] + "\t" + time] == undefined){
		    temp2[mergedAnnotationsCurrent[i][iAttribute2] + "\t" + time] = 0;
		}
		if(!(category in categories)){
		    categories[category] = 0;
		}
		continue;
	    }

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

	    // your annotations
	    key = categoryYours + "\t" + time;
	    if(username == mergedAnnotationsCurrent[i][fn_username]){
		if(key in temp){
		    temp[key]++;
		} else {
		    temp[key] = 1;
		}
	    }

	    // freq
	    key = mergedAnnotationsCurrent[i][iAttribute2] + "\t" + time;
	    if(key in temp2){
		temp2[key]++;
	    } else {
		temp2[key] = 1;
	    }
	}
	categories[categoryYours] = 1;

	// create an empty chart if there is no data to draw
	if(Object.keys(temp).length == 0){
	    var chart = c3.generate({
	    	bindto: '#graph_body',
	    	data: {
	    	    columns: []
	    	}
	    });
	    return;
	}
	
	var adjustedStartRecordingTime = Math.floor(startRecordingTime/histgramInterval/1000) * histgramInterval * 1000;
	for(var i in type){
	    var d = new Date(i * histgramInterval * 1000);
	    if(selectedTimeStyle == "real-time-style"){
		x.push(d.toTimeString().replace(/GMT.*/,"").replace(/:/g,""));
		xTimes.push(time2FormattedTime(d - adjustedStartRecordingTime).replace(/:/g,""));
	    } else {
		// elapsed-time-style
		x.push(time2FormattedTime(d - adjustedStartRecordingTime).replace(/:/g,""));
		xTimes.push(d.toTimeString().replace(/GMT.*/,"").replace(/:/g,""));
	    }
	    y.push(type[i]);
	    
	    if(type[i] > yMaxTimeLineChart){
		yMaxTimeLineChart = type[i];
	    }
 
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

	    for(var j = 0; j < buttonList2.length; j++){
		var category = buttonList2[j];
		var key = category + "\t" + i;
		if(category in categoryFreqs2 == false){
		    categoryFreqs2[category] = [category];
		}
		
		if(key in temp2){
		    categoryFreqs2[category].push(temp2[key]);
		} else {
		    categoryFreqs2[category].push(0);
		}
	    }
	}
	arrayColumns[0] = x;
//	arrayColumns[1] = y;

	if(selectedAttribute == 'attribute-label'){
	    for(var i = 0; i < buttonList.length; i++){
		var category = buttonList[i];
		if(!(category in categoryFreqs)){
		    categoryFreqs[category] = [category];
		    categoryFreqs[category] .push(0);
		}
		arrayColumns.push(categoryFreqs[category]);
	    }
	    
	    for(var i = 0; i < buttonList2.length; i++){
		var category = buttonList2[i];
		if(!(category in categoryFreqs2)){
		    categoryFreqs2[category] = [category];
		    categoryFreqs2[category] .push(0);
		}
		arrayColumns.push(categoryFreqs2[category]);
		typesJSON[category] = 'bar';
		typeNames2.push(category);
	    }
	} else {
	    for(var i = 0; i < buttonList2.length; i++){
		var category = buttonList2[i];
		if(!(category in categoryFreqs2)){
		    categoryFreqs2[category] = [category];
		    categoryFreqs2[category] .push(0);
		}
		arrayColumns.push(categoryFreqs2[category]);
		typesJSON[category] = 'bar';
		typeNames2.push(category);
	    }

	    for(var i = 0; i < buttonList.length; i++){
		var category = buttonList[i];
		if(!(category in categoryFreqs)){
		    categoryFreqs[category] = [category];
		    categoryFreqs[category] .push(0);
		}
		arrayColumns.push(categoryFreqs[category]);
	    }
	}
	arrayColumns.push(categoryFreqs[categoryYours]);

	chartType = "line";
    }
    
    var yMax = selectedGraph == 'selector-timeline-graph' ? yMaxTimeLineChart : evaluationGrade;
    var chart = c3.generate({
	bindto: '#graph_body',
	data: {
	    x: 'x',
	    columns: arrayColumns,
	    type: chartType,
	    types: typesJSON,
	    groups: [typeNames2],
	    order: null
	},
	axis: {
	    x: {
		type: 'category',
	    },
	    y: {
		max: yMax,
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
	color: {
	    pattern: ['#ff7f0e','#1f77b4','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf','#3104a3','#fcf302','#d2260a']
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

    // play video by clicking ticks
    var videoID = getVideoID();
    if(videoID != ""){
	$(".c3-axis-x .tick")
	    .on('click', function(d){
		if(selectedGraph != 'selector-timeline-graph'){
		    return false;
		}
		
		var label = d3.select(this).text();
		$(".c3-axis-x .tick").each(function(i, element){
		    if(d3.select(element).text() == label){
			var elapsedTime;
			if(selectedTimeStyle == "real-time-style"){
			    elapsedTime = xTimes[i];
			} else {
			    elapsedTime = x[i+1];
			}

			// find malformed elapsedTime
			if(!elapsedTime.match(/^(\d\d)(\d\d)(\d\d)$/)){
			    $("#popupWarning-message-graph").html(
				i18nUtil.get("fwm-message-invalid-playback-position-error-1")
				    + "<br />"
				    + i18nUtil.get("fwm-message-invalid-playback-position-error-2")
				    + "<br />(" + elapsedTime + "sec)");
			    $("#popupWarningGraph").popup("open");
			    return false;
			}

			var hms = elapsedTime.match(/^(\d\d)(\d\d)(\d\d)$/);
			var timeToPlay =
			    parseInt(hms[1], 10) * 3600
			    + parseInt(hms[2], 10) * 60
			    + parseInt(hms[3], 10) - offsetTimeToPlay;

			if(timeToPlay < 0){
			    timeToPlay = 0;
			} else if(timeToPlay > 12 * 60 * 60){
			    // over 12hours
			    $("#popupWarning-message-graph").html(
				i18nUtil.get("fwm-message-invalid-playback-position-error-1")
				    + "<br />"
				    + i18nUtil.get("fwm-message-invalid-playback-position-error-2")
				    + "<br />(" + timeToPlay + "sec)");
			    $("#popupWarningGraph").popup("open");
			    return false;
			}
		    
			initVideoPlayer('video-player2', '#popup-watch-video2', timeToPlay);
			$("#popup-watch-video2").popup("open");
			
			// return after matching the first element.
			// i don't know why the label is matched twice.
			return false;
		    }
		});
	    });
    }
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
