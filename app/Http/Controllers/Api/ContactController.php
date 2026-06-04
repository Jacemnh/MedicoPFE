<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactMessage;

class ContactController extends Controller
{
    public function sendContactMessage(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'message' => 'required|string|min:10',
        ]);

        try {
            Mail::to('medicoplateforme@gmail.com')->send(new ContactMessage($validated['email'], $validated['message']));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Votre message a été envoyé avec succès.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Une erreur est survenue lors de l\'envoi du message.'
            ], 500);
        }
    }
}
