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
        Schema::table('professionnels', function (Blueprint $table) {
            $table->timestamp('trial_ends_at')->nullable()->after('etat');
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete()->after('trial_ends_at');
            $table->timestamp('subscription_ends_at')->nullable()->after('subscription_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professionnels', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn(['trial_ends_at', 'subscription_id', 'subscription_ends_at']);
        });
    }
};
