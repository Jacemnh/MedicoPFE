<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PatientAppointmentActionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $titre;
    public $messageStr;
    public $actionUrl;
    public $actionText;

    /**
     * Create a new message instance.
     */
    public function __construct(string $titre, string $messageStr, ?string $actionUrl = null, ?string $actionText = null)
    {
        $this->titre = $titre;
        $this->messageStr = $messageStr;
        $this->actionUrl = $actionUrl;
        $this->actionText = $actionText;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Medico - ' . $this->titre,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.action_rendezvous_patient',
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
