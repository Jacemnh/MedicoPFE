<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AiSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'risk_score',
        'recommended_specialty_id',
        'status',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function messages()
    {
        return $this->hasMany(AiMessage::class);
    }

    public function recommendedSpecialty()
    {
        return $this->belongsTo(Specialite::class, 'recommended_specialty_id');
    }
}
