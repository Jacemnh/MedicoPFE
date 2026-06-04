<?php

$apiKey = 'AIzaSyAl_Q1REifdj8YsAkxkyWlXeSkIL6-UGCE';
$models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-pro-preview'
];

foreach ($models as $model) {
    echo "Testing $model... ";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['contents' => [['parts' => [['text' => 'Hi']]]]]));
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP $httpCode\n";
    if ($httpCode !== 200) {
        $data = json_decode($res, true);
        echo "Error: " . ($data['error']['message'] ?? 'Unknown error') . "\n";
    }
}
