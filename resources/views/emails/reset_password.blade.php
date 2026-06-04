<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Réinitialisation de votre mot de passe</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f6f9;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .header {
            background-color: #6366F1; /* Primary Indigo color */
            color: #fff;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #6366F1;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            margin-top: 15px;
            margin-bottom: 15px;
        }
        .footer {
            background-color: #f8fafc;
            text-align: center;
            padding: 15px;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .small-text {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 30px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Medico</h1>
        </div>
        <div class="content">
            <h2>Bonjour {{ $user->prenom ?? '' }},</h2>
            
            <div class="message">
                <p>Vous recevez cet email car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
                
                <div style="text-align: center;">
                    <a href="{{ $url }}" class="btn">Réinitialiser le mot de passe</a>
                </div>
                
                <p>Ce lien de réinitialisation de mot de passe expirera dans 60 minutes.</p>
                <p>Si vous n'avez pas demandé la réinitialisation de votre mot de passe, aucune autre action n'est requise.</p>
            </div>

            <p>Cordialement,<br>L'équipe Medico</p>

            <div class="small-text">
                Si vous rencontrez des difficultés pour cliquer sur le bouton "Réinitialiser le mot de passe", copiez et collez l'URL ci-dessous dans votre navigateur web :<br>
                <a href="{{ $url }}">{{ $url }}</a>
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Medico. Tous droits réservés.
        </div>
    </div>
</body>
</html>
