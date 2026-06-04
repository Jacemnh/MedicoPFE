<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'rendez_vous_id',
        'montant',
        'date_paiement',
        'statut',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
    ];

    public function rendezVous()
    {
        return $this->belongsTo(RendezVous::class);
    }
}
