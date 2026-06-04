<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'rendez_vous_id',
        'dossier_medical_id',
        'patient_id',
        'professionnel_id',
        'ordonnance_id',
        'diagnostique',
        'notes',
        'date_consultation',
    ];

    protected $casts = [
        'date_consultation' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }

    public function ordonnance()
    {
        return $this->belongsTo(Ordonnance::class);
    }

    public function rendezVous()
    {
        return $this->belongsTo(RendezVous::class);
    }

    public function dossierMedical()
    {
        return $this->belongsTo(DossierMedical::class);
    }

    public function ordonnances()
    {
        return $this->hasMany(Ordonnance::class);
    }
}
