<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creneaux', function (Blueprint $table) {
            // Remove old individual slot columns
            $table->dropColumn(['heure_debut', 'heure_fin']);

            // Add schedule config columns
            $table->json('horaires_travail')->nullable()->after('date');
            $table->integer('duree_consultation_defaut')->default(30)->after('horaires_travail');
        });
    }

    public function down(): void
    {
        Schema::table('creneaux', function (Blueprint $table) {
            $table->dropColumn(['horaires_travail', 'duree_consultation_defaut']);
            $table->time('heure_debut')->after('date');
            $table->time('heure_fin')->after('heure_debut');
        });
    }
};
