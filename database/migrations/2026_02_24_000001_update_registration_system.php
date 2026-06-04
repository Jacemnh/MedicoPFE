<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Step 1: Add date_naissance to users table (skip if already done)
        if (!Schema::hasColumn('users', 'date_naissance')) {
            Schema::table('users', function (Blueprint $table) {
                $table->date('date_naissance')->nullable()->after('telephone');
            });
        }

        // Step 2: Add code_professionnel, remove tarif from professionnels
        if (!Schema::hasColumn('professionnels', 'code_professionnel')) {
            Schema::table('professionnels', function (Blueprint $table) {
                $table->string('code_professionnel')->nullable()->after('specialite_id');
            });
        }

        if (Schema::hasColumn('professionnels', 'tarif')) {
            Schema::table('professionnels', function (Blueprint $table) {
                $table->dropColumn('tarif');
            });
        }

        // Step 3: Generate codes for existing professionals who don't have one
        $professionnels = DB::table('professionnels')
            ->whereNull('code_professionnel')
            ->orWhere('code_professionnel', '')
            ->get();

        foreach ($professionnels as $pro) {
            do {
                $digits = str_pad(random_int(0, 999), 3, '0', STR_PAD_LEFT);
                $letter = chr(random_int(65, 90));
                $code = 'MED-' . $digits . $letter;
            } while (DB::table('professionnels')->where('code_professionnel', $code)->exists());

            DB::table('professionnels')->where('id', $pro->id)->update(['code_professionnel' => $code]);
        }

        // Step 4: Make column not nullable and unique (skip if already done)
        $indexExists = collect(DB::select("SHOW INDEX FROM professionnels WHERE Key_name = 'professionnels_code_professionnel_unique'"))->isNotEmpty();

        if (!$indexExists) {
            Schema::table('professionnels', function (Blueprint $table) {
                $table->string('code_professionnel')->unique()->nullable(false)->change();
            });
        } else {
            // Just ensure not nullable
            Schema::table('professionnels', function (Blueprint $table) {
                $table->string('code_professionnel')->nullable(false)->change();
            });
        }

        // Step 5: Replace cabinet_id with professionnel_id in secretaires
        if (Schema::hasColumn('secretaires', 'cabinet_id')) {
            Schema::table('secretaires', function (Blueprint $table) {
                $table->dropForeign(['cabinet_id']);
                $table->dropColumn('cabinet_id');
            });
        }

        if (!Schema::hasColumn('secretaires', 'professionnel_id')) {
            Schema::table('secretaires', function (Blueprint $table) {
                $table->unsignedBigInteger('professionnel_id')->nullable()->after('user_id');
                $table->foreign('professionnel_id')->references('id')->on('professionnels')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('secretaires', 'professionnel_id')) {
            Schema::table('secretaires', function (Blueprint $table) {
                $table->dropForeign(['professionnel_id']);
                $table->dropColumn('professionnel_id');
            });
        }

        if (!Schema::hasColumn('secretaires', 'cabinet_id')) {
            Schema::table('secretaires', function (Blueprint $table) {
                $table->foreignId('cabinet_id')->constrained()->onDelete('cascade')->after('user_id');
            });
        }

        if (Schema::hasColumn('professionnels', 'code_professionnel')) {
            Schema::table('professionnels', function (Blueprint $table) {
                $table->dropUnique(['code_professionnel']);
                $table->dropColumn('code_professionnel');
            });
        }

        if (!Schema::hasColumn('professionnels', 'tarif')) {
            Schema::table('professionnels', function (Blueprint $table) {
                $table->decimal('tarif', 8, 2)->default(0.00);
            });
        }

        if (Schema::hasColumn('users', 'date_naissance')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('date_naissance');
            });
        }
    }
};
