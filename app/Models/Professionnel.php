<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Professionnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cabinet_id',
        'specialite_id',
        'code_professionnel',
        'duree_consultation_defaut',
        'horaires_travail',
        'etat',
        'diplome_path',
        'trial_ends_at',
        'subscription_id',
        'subscription_ends_at',
    ];

    protected $casts = [
        'horaires_travail' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    /**
     * Get the active subscription for the professional.
     */
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Check if the professional has an active trial.
     */
    public function isTrialActive(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    /**
     * Check if the professional has an active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    /**
     * Générer un code professionnel unique au format MED-XXXY
     * (3 chiffres + 1 lettre majuscule)
     */
    public static function generateCode(): string
    {
        do {
            $digits = str_pad(random_int(0, 999), 3, '0', STR_PAD_LEFT);
            $letter = chr(random_int(65, 90)); // A-Z
            $code = 'MED-' . $digits . $letter;
        } while (self::where('code_professionnel', $code)->exists());

        return $code;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class);
    }

    public function specialite()
    {
        return $this->belongsTo(Specialite::class);
    }

    public function secretaires()
    {
        return $this->hasMany(Secretaire::class);
    }

    public function creneaux()
    {
        return $this->hasMany(Creneau::class);
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function plagesHoraires()
    {
        return $this->hasMany(PlageHoraire::class);
    }
}
