<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    protected $fillable = [
        'professionnel_id',
        'subscription_id',
        'stripe_session_id',
        'montant',
        'statut',
        'date_paiement',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
    ];

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
