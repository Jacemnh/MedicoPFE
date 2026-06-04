<?php
$dir = __DIR__ . '/public/storage';

function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return true;
    }

    if (!is_dir($dir)) {
        return unlink($dir);
    }

    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }

        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }

    }

    return rmdir($dir);
}

echo "Deleting public/storage recursively...\n";
deleteDirectory($dir);
echo "Running storage:link...\n";
exec('php artisan storage:link', $output, $return_var);
echo implode("\n", $output);
echo "\nDone!\n";
