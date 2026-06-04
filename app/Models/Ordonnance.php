<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ordonnance extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'medicaments',
        'date_prescription',
    ];

    protected $casts = [
        'date_prescription' => 'date',
        'medicaments' => 'array', // En supposant JSON ou modification simple plus tard si texte
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
