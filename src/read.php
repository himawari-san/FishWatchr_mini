<?php

header('Content-Type: application/json');

$url = $_POST['url'];
$json_page = file_get_contents($url);

echo $json_page;

?>