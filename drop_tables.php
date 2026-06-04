<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
DB::statement('DROP TABLE IF EXISTS ai_messages');
DB::statement('DROP TABLE IF EXISTS ai_sessions');
DB::table('migrations')->where('migration', 'like', '%ai_sessions%')->delete();
DB::table('migrations')->where('migration', 'like', '%ai_messages%')->delete();
echo 'done';
