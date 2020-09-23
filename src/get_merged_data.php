<?php
require_once(".ht_fw_mini.inc");

header('Content-Type: application/text');

setlocale(LC_ALL, 'ja_JP.UTF-8');

$time_file_type_elapsed = "elapsed";
$time_file_type_absolute = "absolute";


if(!isset($_POST['groupname'])){
  $error = "no groupname";
  http_response_code(404);
  echo json_encode(compact('error'));
  exit;
}

$groupname = $_POST['groupname'];
$time_file_prefix = $_POST['timefile'];

$annotations = "";

// get the last time file
$timefiles = glob($data_dir . $time_file_prefix . "_*" . $groupname . ".xml");
usort($timefiles, function($a, $b){
    // ascending order
    return filemtime($a) < filemtime($b);
});

// output time info
if(count($timefiles) != 0){
    $temp = file_get_contents($timefiles[0]);
    $time_file_type = $time_file_type_absolute;
    if(preg_match('/' . $time_file_prefix . '_\d+_' . $time_file_type_elapsed . '_', $timefiles[0]) === 1){
        $time_file_type = $time_file_type_elapsed;
    }

    if(preg_match('/ original_start_time="(.+?)"/', $temp, $matches)){
        $annotations = $time_file_prefix . "\t" . $matches[1] . "\t" . $time_file_type . "\n";
    }
}



$groupfiles = glob($data_dir . "*_" . $groupname . ".txt");
foreach($groupfiles as $file){
    $annotations .= file_get_contents($file);
}

echo $annotations;
?>
