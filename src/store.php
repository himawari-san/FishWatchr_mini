<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/json');

// data directory

if($_POST['fileType'] !== "txt" && $_POST['fileType'] !== "xml"){
  $error = "invalid fileType";
  http_response_code(404);
  echo json_encode(compact('error'));
  exit;
} else {
  $savename = str_replace("/", "_", str_replace(":", "", $_POST['savename']));
  $groupname = isset($_POST['groupname']) ? $_POST['groupname'] : "";
  $timestamp = md5(microtime(true));
  $suffix = "." . $_POST['fileType'];

  $filenameStem = $savename . "_" . $groupname;
  $filename = $filenameStem . $suffix;
  $resultFile = $data_dir . $filename;

  // write the file to data_dir
  if(file_put_contents($resultFile, $_POST['databody']) === false){
    $error = "server error";
    http_response_code(400);
    echo json_encode(compact('error'));
    exit;
  }

  // copy the file to www dir with a timestamp
  $publishedFilename = $filenameStem . "_" . $timestamp . $suffix;
  if(!copy($resultFile, $publish_dir . $publishedFilename)){
    $error = "server error";
    http_response_code(400);
    echo json_encode(compact('error'));
    exit;
  }

  $result_url = $result_url_base . $publishedFilename;
  echo json_encode(compact('result_url'));
}
?>
