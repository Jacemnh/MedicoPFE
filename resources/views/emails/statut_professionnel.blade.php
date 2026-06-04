<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $status === 'accepte' ? 'Bienvenue sur Medico' : 'Statut de votre inscription' }}</title>
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
            background-color: {{ $status === 'accepte' ? '#10b981' : '#64748b' }}; /* Green for success, gray for other */
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
            background-color: #10b981;
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
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Medico</h1>
        </div>
        <div class="content">
            <h2>Bonjour {{ $user->prenom }} {{ $user->nom }},</h2>
            
            <div class="message">
            @if($status === 'accepte')
                <p>Nous avons le plaisir de vous annoncer que votre compte professionnel sur la plateforme <strong>Medico</strong> a été validé avec succès par notre équipe !</p>
                <p>Vous pouvez dès à présent vous connecter à votre tableau de bord professionnel pour :</p>
                <ul>
                    <li>Configurer vos services et horaires de travail.</li>
                    <li>Gérer vos rendez-vous et patients.</li>
                    <li>Ajouter des collaborateurs (secrétaires).</li>
                </ul>
                <div style="text-align: center;">
                    <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/login" class="btn">Accéder à mon compte</a>
                </div>
            @else
                <p>Nous vous remercions pour l'intérêt que vous portez à <strong>Medico</strong>.</p>
                <p>Après étude de votre demande d'inscription, nous avons le regret de vous informer que nous ne pouvons pas valider votre compte professionnel pour le moment.</p>
                <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez obtenir plus d'informations, n'hésitez pas à nous contacter à support@medico.com.</p>
            @endif
            </div>

            <p>Cordialement,<br>L'équipe Medico</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Medico. Tous droits réservés.
        </div>
    </div>
</body>
</html>
