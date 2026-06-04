<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport Financier</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 13px; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
        .title-block { text-align: right; }
        .title-block h1 { font-size: 20px; color: #111827; margin-bottom: 5px; }
        .title-block p { color: #6b7280; font-size: 12px; }
        
        .info-section { display: table; width: 100%; margin-bottom: 30px; }
        .info-box { display: table-cell; width: 50%; }
        .info-box h3 { font-size: 14px; color: #4b5563; margin-bottom: 8px; text-transform: uppercase; }
        .info-box p { margin-bottom: 4px; color: #374151; }
        
        .summary-grid { display: table; width: 100%; margin-bottom: 40px; border-spacing: 15px 0; }
        .summary-card { display: table-cell; width: 33.33%; background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
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
                        <h1>Rapport Financier</h1>
                        <p>Généré le {{ $date_generation }}</p>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="info-section">
        <div class="info-box" style="padding-right: 20px;">
            <h3>Professionnel de santé</h3>
            <p><strong>Dr. {{ $user->nom }} {{ $user->prenom }}</strong></p>
            <p>{{ $user->email }}</p>
            <p>{{ $user->telephone }}</p>
        </div>
        <div class="info-box">
            <h3>Informations du cabinet</h3>
            <p><strong>{{ $cabinet ? $cabinet->nom : 'Cabinet non renseigné' }}</strong></p>
            <p>{{ $cabinet ? $cabinet->adresse : '' }}</p>
            <p>{{ $cabinet ? $cabinet->ville . ', ' . $cabinet->pays : '' }}</p>
        </div>
    </div>

    <div class="table-title">Résumé de l'année ({{ date('Y') }})</div>
    <div class="summary-grid">
        <div class="summary-card">
            <h4>Revenus (Ce mois)</h4>
            <div class="amount">{{ number_format($stats['month'], 2, ',', ' ') }} €</div>
        </div>
        <div class="summary-card primary">
            <h4>Revenus (Cette année)</h4>
            <div class="amount">{{ number_format($stats['year'], 2, ',', ' ') }} €</div>
        </div>
        <div class="summary-card warning">
            <h4>Paiements en attente</h4>
            <div class="amount">{{ number_format($stats['pending'], 2, ',', ' ') }} €</div>
        </div>
    </div>

    <div class="table-container">
        <div class="table-title">Détail des transactions ({{ date('Y') }})</div>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Montant</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transactions as $trx)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($trx->created_at)->format('d/m/Y') }}</td>
                    <td>
                        @if($trx->rendezVous && $trx->rendezVous->patient && $trx->rendezVous->patient->user)
                            {{ $trx->rendezVous->patient->user->nom }} {{ $trx->rendezVous->patient->user->prenom }}
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
                    <td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">Aucune transaction trouvée pour cette année.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Ce document est un rapport financier généré automatiquement par la plateforme Medico.</p>
        <p>Ne vaut pas facture individuelle pour les patients.</p>
    </div>
</body>
</html>
