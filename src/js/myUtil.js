// input/@type="text", "range"
function getValueFromInput(id){
    return document.getElementById(id).value;
}

// input/@type="text"
function setValueToInput(id, value){
    document.getElementById(id).value = value;
}


// select
function getSelectedValue(id){
    return document.getElementById(id).value;
}

// select
function setSelector(id, value){
    document.getElementById(id).value = value;
}

function setInnerText(id, text){
    document.getElementById(id).innerText = text;
}

function getText(id){
    return document.getElementById(id).textContent;
}


// input/@type="checkbox"
function checkCheckBox(id){
    document.getElementById(id).checked = true;
}

// input/@type="checkbox"
function unCheckCheckBox(id){
    document.getElementById(id).checked = false;
}

// input/@type="checkbox"
function isChecked(id){
    return document.getElementById(id).checked;
}

// input/@type="radio"
function checkRadio(id){
    document.getElementById(id).checked = true;
}


function eSetAttribute(id, name, value){
    document.getElementById(id).setAttribute(name, value);
}

function eGeAttribute(id, name){
    return document.getElementById(id).getAttribute(name);
}

