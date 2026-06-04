<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DossierMedical extends Model
{
    use HasFactory;

    protected $table = 'dossier_medicals';

    protected $fillable = [
        'patient_id',
        'consultation_id',
        'description',
        'groupe_sanguin',
        'maladies_chroniques',
        'poids',
        'taille',
        'allergies',
        'vaccinations',
    ];

    protected $casts = [
        'vaccinations' => 'array',
        'allergies' => 'array',
    ];


    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
