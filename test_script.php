<?php
$u = App\Models\User::where('prenom', 'like', '%amen%')->first();
$token = $u->createToken('Test')->plainTextToken;
echo "Token: $token\n";
