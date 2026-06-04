<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subscription;
use App\Services\AdminActivityLogger;

class AdminSubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $subscriptions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $subscription = Subscription::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'price' => $validated['price'],
            'description' => $validated['description'] ?? null,
            'is_active' => $request->has('is_active') ? $validated['is_active'] : true,
        ]);

        AdminActivityLogger::log('created', Subscription::class, $subscription->id, ['name' => $subscription->name]);

        return response()->json([
            'success' => true,
            'message' => 'Abonnement créé avec succès.',
            'data' => $subscription
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Abonnement introuvable.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $subscription
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Abonnement introuvable.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $subscription->update($validated);

        AdminActivityLogger::log('updated', Subscription::class, $subscription->id, ['name' => $subscription->name]);

        return response()->json([
            'success' => true,
            'message' => 'Abonnement mis à jour avec succès.',
            'data' => $subscription
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Abonnement introuvable.'], 404);
        }

        $subscriptionName = $subscription->name;
        $subscription->delete();

        AdminActivityLogger::log('deleted', Subscription::class, $id, ['name' => $subscriptionName]);

        return response()->json([
            'success' => true,
            'message' => 'Abonnement supprimé avec succès.'
        ]);
    }
    
    /**
     * Toggle the active status of the subscription.
     */
    public function toggleActive(string $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Abonnement introuvable.'], 404);
        }

        $subscription->is_active = !$subscription->is_active;
        $subscription->save();

        AdminActivityLogger::log(
            $subscription->is_active ? 'activated' : 'deactivated',
            Subscription::class,
            $subscription->id,
            ['name' => $subscription->name]
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut de l\'abonnement mis à jour.',
            'data' => $subscription
        ]);
    }
}
