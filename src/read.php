<?php

header('Content-Type: application/json');

$options= [
    'http' => [
        'method' => "GET",
        'header' => "User-Agent: php"
    ]
];

$url = $_POST['url'];
$json_page = file_get_contents($url, false, stream_context_create($options));

$encode = mb_detect_encoding($json_page, "UTF-8, SJIS, EUC-JP, JIS, ASCII");
if($encode !== "UTF-8"){
  $json_page = mb_convert_encoding($json_page, "UTF-8", $encode);
}

echo $json_page;

?>