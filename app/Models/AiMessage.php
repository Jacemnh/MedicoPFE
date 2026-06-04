<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AiMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'ai_session_id',
        'role',
        'content',
        'tool_calls',
    ];

    protected $casts = [
        'tool_calls' => 'array',
    ];

    public function session()
    {
        return $this->belongsTo(AiSession::class, 'ai_session_id');
    }
}
