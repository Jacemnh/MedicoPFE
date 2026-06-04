<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CabinetCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $code;
    public $nom;
    public $prenom;

    /**
     * Create a new message instance.
     */
    public function __construct(string $code, string $nom, string $prenom)
    {
        $this->code = $code;
        $this->nom = $nom;
        $this->prenom = $prenom;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre code de liaison cabinet - Medico',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.code_cabinet',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
