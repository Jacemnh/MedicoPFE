<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plages_horaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professionnel_id')->constrained('professionnels')->onDelete('cascade');
            $table->date('date');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->enum('statut', ['disponible', 'reserve', 'inactif'])->default('disponible');
            $table->timestamps();
            
            // Un professionnel ne peut pas avoir deux créneaux qui commencent exactement à la même heure
            // $table->unique(['professionnel_id', 'date', 'heure_debut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plages_horaires');
    }
};
