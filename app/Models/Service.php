<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'specialite_id',
        'professionnel_id',
        'description',
        'prix',
        'est_actif',
    ];

    public function specialite()
    {
        return $this->belongsTo(Specialite::class);
    }

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }
}
