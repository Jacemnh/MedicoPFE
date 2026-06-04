<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professionnels', function (Blueprint $table) {
            $table->string('diplome_path')->nullable()->after('etat');
        });
    }

    public function down(): void
    {
        Schema::table('professionnels', function (Blueprint $table) {
            $table->dropColumn('diplome_path');
        });
    }
};
