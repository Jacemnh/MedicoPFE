<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RendezVous extends Model
{
    use HasFactory;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'patient_id',
        'professionnel_id',
        'service_id',
        'date_heure',
        'statut',
        'montant',
        'motif',
        'plage_horaire_id',
        'reprogrammed',
    ];

    protected $casts = [
        'date_heure' => 'datetime',
        'reprogrammed' => 'boolean',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class);
    }

    public function consultation()
    {
        return $this->hasOne(Consultation::class);
    }

    public function plageHoraire()
    {
        return $this->belongsTo(PlageHoraire::class, 'plage_horaire_id');
    }
}
