const BASE_URL = import.meta.env.VITE_API_URL as string;

/**
 * ApiError class
 * @param {number} status
 * @param {string} statusText
 * @param {string} message
 */
export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }

    get isUnauthorized() {
        return this.status === 401;
    }
    get isForbidden() {
        return this.status === 403;
    }
    get isNotFound() {
        return this.status === 404;
    }
}

// Caching system
let _token: string | null = localStorage.getItem("auth_token");

export const tokenStore = {
    get(): string | null {
        return _token;
    },

    set(token: string): void {
        _token = token;
        localStorage.setItem("auth_token", token);
    },

    clear(): void {
        _token = null;
        localStorage.removeItem("auth_token");
    },
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions<TBody = unknown> {
    method?: HttpMethod;
    body?: TBody;
    /** No JWT required */
    public?: boolean;
    /** Allows request cancellation */
    signal?: AbortSignal;
}

/**
 * Fetch data from the API
 * @param {string} path
 * @param {RequestOptions} options
 * @returns {Promise<TResponse>}
 */
export async function apiFetch<TResponse>(
    path: string,
    options: RequestOptions = {}
): Promise<TResponse> {
    const { method = "GET", body, public: isPublic = false, signal } = options;

    const headers: HeadersInit = { "Content-Type": "application/json" };

    // Add JWT if not public and token is present
    if (!isPublic && _token) {
        headers["Authorization"] = `Bearer ${_token}`;
    }

    // Fetch the data
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        signal,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Handle errors
    if (!response.ok) {
        let message = response.statusText;
        try {
            const json = await response.json();
            message = json?.message ?? json?.error ?? message;
        } catch {
            // Non-JSON error body
        }

        // Clear token if unauthorized
        if (response.status === 401) tokenStore.clear();

        throw new ApiError(response.status, response.statusText, message);
    }

    // Return undefined if no content
    if (response.status === 204) return undefined as TResponse;

    return response.json() as Promise<TResponse>;
}

/**
 * Serialize a plain object into a URL query string, omitting undefined values.
 * @param {Record<string, string | number | boolean | undefined>} params
 * @returns {string}
 */
export function toQueryString(
    params: Record<string, string | number | boolean | undefined>
): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) qs.set(key, String(value));
    }
    const str = qs.toString();
    return str ? `?${str}` : "";
}
