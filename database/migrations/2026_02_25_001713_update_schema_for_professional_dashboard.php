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
        // 1. Update users table
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'name') && !Schema::hasColumn('users', 'nom')) {
                $table->renameColumn('name', 'nom');
            }
            if (!Schema::hasColumn('users', 'prenom')) {
                $table->string('prenom')->nullable()->after('nom');
            }
        });

        // 2. Update professionnels table
        Schema::table('professionnels', function (Blueprint $table) {
            if (!Schema::hasColumn('professionnels', 'duree_consultation_defaut')) {
                $table->integer('duree_consultation_defaut')->default(30)->after('code_professionnel');
            }
            if (!Schema::hasColumn('professionnels', 'horaires_travail')) {
                $table->json('horaires_travail')->nullable()->after('duree_consultation_defaut');
            }
        });

        // 3. Update services table
        Schema::table('services', function (Blueprint $table) {
            if (!Schema::hasColumn('services', 'prix')) {
                $table->decimal('prix', 8, 2)->default(0.00)->after('description');
            }
            if (!Schema::hasColumn('services', 'est_actif')) {
                $table->boolean('est_actif')->default(true)->after('prix');
            }
            if (!Schema::hasColumn('services', 'professionnel_id')) {
                $table->foreignId('professionnel_id')->nullable()->constrained('professionnels')->onDelete('cascade')->after('specialite_id');
            }
        });

        // 4. Update rendez_vous table
        Schema::table('rendez_vous', function (Blueprint $table) {
            if (!Schema::hasColumn('rendez_vous', 'service_id')) {
                $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null')->after('professionnel_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            if (Schema::hasColumn('rendez_vous', 'service_id')) {
                $table->dropForeign(['service_id']);
                $table->dropColumn('service_id');
            }
        });

        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasColumn('services', 'professionnel_id')) {
                $table->dropForeign(['professionnel_id']);
                $table->dropColumn('professionnel_id');
            }
            $table->dropColumn(['prix', 'est_actif']);
        });

        Schema::table('professionnels', function (Blueprint $table) {
            $table->dropColumn(['duree_consultation_defaut', 'horaires_travail']);
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'nom')) {
                $table->renameColumn('nom', 'name');
            }
            $table->dropColumn('prenom');
        });
    }
};
