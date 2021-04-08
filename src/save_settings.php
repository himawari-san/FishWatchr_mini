<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/json');

$params = json_decode(file_get_contents('php://input'), true);

$savename = $params['savename'];

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
if(file_put_contents($resultFile, json_encode($params['databody'], JSON_UNESCAPED_UNICODE)) === false){
    $error = "fail_to_save";
    echo json_encode(compact('error'));
    exit;
}

echo json_encode(compact('url'));
?>
