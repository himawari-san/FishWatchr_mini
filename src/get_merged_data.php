<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/text');

setlocale(LC_ALL, 'ja_JP.UTF-8');

$txt_dir = "txt/";
$xml_dir = "xml/";

if(!isset($_POST['groupname'])){
  $error = "no groupname";
  http_response_code(404);
  echo json_encode(compact('error'));
  exit;
}

$groupname = $_POST['groupname'];

$groupfiles = glob($data_dir . "*_" . $groupname . ".txt");
foreach($groupfiles as $file){
    $annotations .= file_get_contents($file);
}

echo $annotations;
?>
