<x-guest-layout>
    <form method="POST" action="{{ route('register') }}">
        @csrf

        <!-- Name -->
        <div>
            <x-input-label for="name" :value="__('Name')" />
            <x-text-input id="name" class="block mt-1 w-full" type="text" name="name" :value="old('name')" required autofocus autocomplete="name" />
            <x-input-error :messages="$errors->get('name')" class="mt-2" />
        </div>

        <!-- Email Address -->
        <div class="mt-4">
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autocomplete="username" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" />

            <x-text-input id="password" class="block mt-1 w-full"
                            type="password"
                            name="password"
                            required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Confirm Password -->
        <div class="mt-4">
            <x-input-label for="password_confirmation" :value="__('Confirm Password')" />

            <x-text-input id="password_confirmation" class="block mt-1 w-full"
                            type="password"
                            name="password_confirmation" required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
        </div>

        <!-- Role Selection -->
        <div class="mt-4">
            <x-input-label for="role" :value="__('Role')" />
            <select id="role" name="role" class="block mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm" onchange="toggleFields()">
                <option value="patient">Patient</option>
                <option value="professionnel">Professionnel de Santé</option>
                <option value="secretaire">Secrétaire</option>
            </select>
            <x-input-error :messages="$errors->get('role')" class="mt-2" />
        </div>

        <!-- Professional/Secretary Fields -->
        <div id="cabinet-field" class="mt-4 hidden">
            <x-input-label for="cabinet_id" :value="__('Cabinet')" />
            <select id="cabinet_id" name="cabinet_id" class="block mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                <option value="">Sélectionnez un cabinet</option>
                @foreach($cabinets as $cabinet)
                    <option value="{{ $cabinet->id }}">{{ $cabinet->nom }}</option>
                @endforeach
            </select>
            <x-input-error :messages="$errors->get('cabinet_id')" class="mt-2" />
        </div>

        <!-- Professional Specific Fields -->
        <div id="pro-fields" class="hidden">
            <div class="mt-4">
                <x-input-label for="specialite_id" :value="__('Spécialité')" />
                 <select id="specialite_id" name="specialite_id" class="block mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                    @foreach(\App\Models\Specialite::all() as $spec)
                        <option value="{{ $spec->id }}">{{ $spec->nom }}</option>
                    @endforeach
                </select>
                <x-input-error :messages="$errors->get('specialite_id')" class="mt-2" />
            </div>
             <div class="mt-4">
                <x-input-label for="tarif" :value="__('Tarif de consultation (MAD)')" />
                <x-text-input id="tarif" class="block mt-1 w-full" type="number" step="0.01" name="tarif" :value="old('tarif')" />
                <x-input-error :messages="$errors->get('tarif')" class="mt-2" />
            </div>
        </div>

        <script>
            function toggleFields() {
                const role = document.getElementById('role').value;
                const cabinetField = document.getElementById('cabinet-field');
                const proFields = document.getElementById('pro-fields');

                if (role === 'professionnel' || role === 'secretaire') {
                    cabinetField.classList.remove('hidden');
                } else {
                    cabinetField.classList.add('hidden');
                }

                if (role === 'professionnel') {
                    proFields.classList.remove('hidden');
                } else {
                    proFields.classList.add('hidden');
                }
            }
        </script>

        <div class="flex items-center justify-end mt-4">
            <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" href="{{ route('login') }}">
                {{ __('Already registered?') }}
            </a>

            <x-primary-button class="ms-4">
                {{ __('Register') }}
            </x-primary-button>
        </div>
    </form>
</x-guest-layout>
