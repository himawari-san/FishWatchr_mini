<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/json');

setlocale(LC_ALL, 'ja_JP.UTF-8');

$txt_dir = "txt/";
$xml_dir = "xml/";

if(!isset($_POST['groupname'])){
  $error = "can not create a zip file";
  http_response_code(404);
  echo json_encode(compact('error'));
  exit;
}

$groupname = $_POST['groupname'];
$timestamp = md5(microtime(true));

$publishedFilename = $groupname . "_" . $timestamp . ".zip";
$zipArchive = new ZipArchive;
if($zipArchive->open($publish_dir . $publishedFilename, ZipArchive::CREATE|ZipArchive::OVERWRITE) === false){
  
}

$zipArchive->addEmptyDir($txt_dir);
$groupfiles = glob($data_dir . "*_" . $groupname . ".txt");
addFile2Zip($zipArchive, $groupfiles, $txt_dir);

$zipArchive->addFromString("all_annotations.txt", catString($groupfiles));

$zipArchive->addEmptyDir($xml_dir);
$groupfiles = glob($data_dir . "*_" . $groupname . ".xml");
addFile2Zip($zipArchive, $groupfiles, $xml_dir);

$zipArchive->close();

$result_url = $result_url_base . $publishedFilename;
echo json_encode(compact('result_url'));

// attention: $arrayFiles will be "basename"ed
function addFile2Zip($zip, $arrayFiles, $rootdir){
  foreach($arrayFiles as $file){
    $basefile = basename($file);
    $zip->addFile($file, $rootdir . $basefile);
  }
}

function catString($arrayFiles){
  $result = "";
  
  foreach($arrayFiles as $file){
    $result .= file_get_contents($file);
  }

  return $result;
}



?>
