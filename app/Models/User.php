<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Les attributs pouvant être assignés en masse.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'prenom',
        'sexe',
        'email',
        'password',
        'role',
        'telephone',
        'date_naissance',
        'photo',
        'is_blocked',
    ];

    /**
     * Les attributs qui doivent être cachés pour la sérialisation.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Obtenir les attributs qui doivent être transtypés.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_blocked' => 'boolean',
            'date_naissance' => 'date',
        ];
    }

    public function patient()
    {
        return $this->hasOne(Patient::class);
    }

    public function admin()
    {
        return $this->hasOne(Admin::class);
    }

    public function professionnel()
    {
        return $this->hasOne(Professionnel::class);
    }

    public function secretaire()
    {
        return $this->hasOne(Secretaire::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isProfessionnel()
    {
        return $this->role === 'professionnel';
    }

    public function isSecretaire()
    {
        return $this->role === 'secretaire';
    }

    public function isPatient()
    {
        return $this->role === 'patient';
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }
}
