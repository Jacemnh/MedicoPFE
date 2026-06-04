<?php
$publicStoragePath = __DIR__ . '/public/storage';

if (file_exists($publicStoragePath)) {
    if (is_link($publicStoragePath) || is_dir($publicStoragePath)) {
        echo "Removing existing storage link/directory...\n";
        // En Windows, rmdir fonctionne pour les jonctions et les dossiers
        rmdir($publicStoragePath);
    }
}

echo "Running storage:link artisan command...\n";
exec('php artisan storage:link', $output, $return_var);
echo implode("\n", $output);
echo "\nDone with exit code: " . $return_var . "\n";
