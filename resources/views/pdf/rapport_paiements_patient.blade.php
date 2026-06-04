<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport de Paiements</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 13px; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
        .title-block { text-align: right; }
        .title-block h1 { font-size: 20px; color: #111827; margin-bottom: 5px; }
        .title-block p { color: #6b7280; font-size: 12px; }
        
        .info-section { margin-bottom: 30px; }
        .info-box h3 { font-size: 14px; color: #4b5563; margin-bottom: 8px; text-transform: uppercase; }
        .info-box p { margin-bottom: 4px; color: #374151; }
        
        .summary-grid { display: table; width: 100%; margin-bottom: 40px; border-spacing: 15px 0; }
        .summary-card { display: table-cell; width: 50%; background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
        .summary-card h4 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
        .summary-card .amount { font-size: 22px; font-weight: bold; color: #111827; }
        .summary-card.primary { background: #eff6ff; border-color: #bfdbfe; }
        .summary-card.primary .amount { color: #1d4ed8; }
        .summary-card.warning { background: #fffbeb; border-color: #fde68a; }
        .summary-card.warning .amount { color: #b45309; }

        .table-container { margin-bottom: 30px; }
        .table-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f9fafb; padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #4b5563; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
        
        .status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
        .status-paye { background-color: #d1fae5; color: #065f46; }
        .status-en_attente { background-color: #fef3c7; color: #92400e; }
        .status-echoue { background-color: #fee2e2; color: #b91c1c; }
        
        .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <table width="100%">
            <tr>
                <td style="border:none; padding:0;">
                    <div class="logo">Medico</div>
                </td>
                <td style="border:none; padding:0; text-align:right;">
                    <div class="title-block">
                        <h1>Historique des Paiements</h1>
                        <p>Généré le {{ $date_generation }}</p>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="info-section">
        <div class="info-box">
            <h3>Patient</h3>
            <p><strong>{{ $user->nom }} {{ $user->prenom }}</strong></p>
            <p>{{ $user->email }}</p>
            <p>{{ $user->telephone }}</p>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card primary">
            <h4>Total Payé</h4>
            <div class="amount">{{ number_format($totalPaye, 2, ',', ' ') }} €</div>
        </div>
        <div class="summary-card warning">
            <h4>Reste à Payer (En attente)</h4>
            <div class="amount">{{ number_format($totalAttente, 2, ',', ' ') }} €</div>
        </div>
    </div>

    <div class="table-container">
        <div class="table-title">Détail des transactions</div>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Professionnel</th>
                    <th>Service</th>
                    <th>Montant</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                @forelse($payments as $trx)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($trx->created_at)->format('d/m/Y') }}</td>
                    <td>
                        @if($trx->rendezVous && $trx->rendezVous->professionnel && $trx->rendezVous->professionnel->user)
                            Dr. {{ $trx->rendezVous->professionnel->user->nom }} {{ $trx->rendezVous->professionnel->user->prenom }}
                        @else
                            N/A
                        @endif
                    </td>
                    <td>
                        {{ $trx->rendezVous && $trx->rendezVous->service ? $trx->rendezVous->service->nom : 'Standard' }}
                    </td>
                    <td style="font-weight: bold;">{{ number_format($trx->montant, 2, ',', ' ') }} €</td>
                    <td>
                        @if($trx->statut == 'paye')
                            <span class="status status-paye">Payé</span>
                        @elseif($trx->statut == 'en_attente')
                            <span class="status status-en_attente">En attente</span>
                        @else
                            <span class="status status-echoue">{{ ucfirst($trx->statut) }}</span>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">Aucun paiement trouvé.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Ce document est un historique informatif généré automatiquement par la plateforme Medico.</p>
        <p>Il ne remplace pas une facture officielle émise par votre professionnel de santé.</p>
    </div>
</body>
</html>
