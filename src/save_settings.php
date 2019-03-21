<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/json');

$savename = $_POST['savename'];

$filenameStem = $savename;
$filename = $savename . ".json";
$resultFile = $data_dir . $filename;
$url = $result_url_base . $filename;

if(file_exists($resultFile)){
    $error = "already_exists";
    echo json_encode(compact('error', 'url'));
    exit;
}

// write the file to data_dir
if(file_put_contents($resultFile, json_encode($_POST['databody'], JSON_UNESCAPED_UNICODE)) === false){
    $error = "fail_to_save";
    echo json_encode(compact('error'));
    exit;
}

echo json_encode(compact('url'));
?>
