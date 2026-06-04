<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->unsignedBigInteger('plage_horaire_id')->nullable()->after('professionnel_id');
            $table->foreign('plage_horaire_id')->references('id')->on('plages_horaires')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->dropForeign(['plage_horaire_id']);
            $table->dropColumn('plage_horaire_id');
        });
    }
};
