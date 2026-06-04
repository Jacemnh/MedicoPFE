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
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->default('info'); // info, action_required, success, warning
            $table->string('titre')->nullable(); // Titre court de la notification
            $table->string('action_type')->nullable(); // e.g., 'reschedule_response'
            $table->unsignedBigInteger('related_id')->nullable(); // ID lié (ex: rendez_vous_id)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['type', 'titre', 'action_type', 'related_id']);
        });
    }
};
