<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlageHoraire extends Model
{
    use HasFactory;

    protected $table = 'plages_horaires';

    protected $fillable = [
        'professionnel_id',
        'date',
        'heure_debut',
        'heure_fin',
        'statut',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }

    public function rendezVous()
    {
        return $this->hasOne(RendezVous::class, 'plage_horaire_id');
    }
}
