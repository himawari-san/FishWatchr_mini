<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/json');

$params = json_decode(file_get_contents('php://input'), true);

if(!isset($params['groupname'])){
    // no groupname
    http_response_code(404);
    exit;
}

$groupname = $params['groupname'];
$configFile = $data_dir . $groupname . ".json";

if(!file_exists($configFile)){
    // File not found
    http_response_code(404);
    exit;
}

$config = file_get_contents($configFile, false);

$encode = mb_detect_encoding($config, "UTF-8, SJIS, EUC-JP, JIS, ASCII");
if($encode !== "UTF-8"){
  $config = mb_convert_encoding($config, "UTF-8", $encode);
}

echo $config;

?>
