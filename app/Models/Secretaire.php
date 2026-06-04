<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Secretaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'professionnel_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function professionnel()
    {
        return $this->belongsTo(Professionnel::class);
    }
}
