<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Creneau extends Model
{
    use HasFactory;

    protected $table = 'creneaux';

    protected $fillable = [
        'professionnel_id',
        'date',
        'horaires_travail',
        'duree_consultation_defaut',
        'disponible',
    ];

    protected $casts = [
        'date' => 'date',
        'horaires_travail' => 'array',
        'disponible' => 'boolean',
    ];

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }
}
