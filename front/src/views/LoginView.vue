<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { authApi } from "@/api";
import { useAuthStore } from "@/composables/useAuthStore";
import ButtonComponent from "@/components/common/ButtonComponent.vue";
import { getErrorMessage } from "@/utils/error";

const router = useRouter();
const route = useRoute();
const redirect = computed(() => route.query.redirect as string | undefined);
const { setUser } = useAuthStore();
const email = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);

const DEMO_ACCOUNTS = [
    {
        email: "admin@babyfoot.local",
        password: "Password123!",
        role: "Admin (seed)",
    },
];

/**
 * Submit the login form and redirect to the home page on success.
 * @returns {Promise<void>}
 */
async function onSubmit() {
    error.value = "";

    if (!email.value || !password.value) {
        error.value = "Email et mot de passe requis.";
        return;
    }

    isSubmitting.value = true;

    try {
        const res = await authApi.login({
            email: email.value,
            password: password.value,
        });

        setUser(res.user);

        const target = redirect.value;
        router.push(target && target.startsWith("/") ? target : "/");
    } catch (e) {
        error.value = getErrorMessage(e, "Erreur de connexion.");
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <div class="max-w-md mx-auto px-4 py-16">
        <h1 class="text-2xl font-bold text-gray-900 mb-8">Connexion</h1>

        <div
            class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6"
        >
            <form @submit.prevent="onSubmit" class="space-y-4">
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        autocomplete="email"
                        required
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="admin@babyfoot.local"
                    />
                </div>
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Mot de passe
                    </label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        autocomplete="current-password"
                        required
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Password123!"
                    />
                </div>
                <p v-if="error" role="alert" class="text-sm text-red-600">
                    {{ error }}
                </p>
                <ButtonComponent
                    type="submit"
                    :loading="isSubmitting"
                    class="w-full"
                >
                    Se connecter
                </ButtonComponent>
            </form>
        </div>

        <div
            class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800"
        >
            <p class="font-semibold mb-2">
                Comptes de démo (après
                <code class="bg-amber-100 px-1 rounded">npm run seed</code>)
            </p>
            <ul class="space-y-1 font-mono text-xs">
                <li v-for="acc in DEMO_ACCOUNTS" :key="acc.email">
                    {{ acc.email }} / {{ acc.password }}
                    <span class="text-amber-600">({{ acc.role }})</span>
                </li>
            </ul>
        </div>
    </div>
</template>
