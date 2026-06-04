<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cabinet extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'adresse',
        'ville',
        'pays',
        'telephone',
        'email',
    ];

    public function professionnels()
    {
        return $this->hasMany(Professionnel::class);
    }

    public function secretaires()
    {
        return $this->hasMany(Secretaire::class);
    }
}
