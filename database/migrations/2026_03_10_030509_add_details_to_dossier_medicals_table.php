<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dossier_medicals', function (Blueprint $table) {
            $table->string('groupe_sanguin')->nullable();
            $table->text('maladies_chroniques')->nullable();
            $table->decimal('poids', 5, 2)->nullable(); // Poids en kg
            $table->integer('taille')->nullable(); // Taille en cm
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dossier_medicals', function (Blueprint $table) {
            $table->dropColumn(['groupe_sanguin', 'maladies_chroniques', 'poids', 'taille']);
        });
    }
};
