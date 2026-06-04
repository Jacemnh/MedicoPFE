<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialite extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
    ];

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function professionnels()
    {
        return $this->hasMany(Professionnel::class);
    }
}
