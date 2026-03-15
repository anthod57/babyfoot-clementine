import { ref, shallowRef, watch, onUnmounted } from "vue";
import type { WatchSource } from "vue";

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

interface UseQueryOptions<T> {
    /** Reactive sources that trigger a re-fetch when they change */
    watch?: WatchSource[];
    /** Transform or validate the raw response before storing it */
    transform?: (data: T) => T;
}

/**
 * Use a query to fetch data
 * @param {Fetcher<T>} fetcher
 * @param {UseQueryOptions<T>} options
 * @returns {Ref<T | null>}
 * @returns {Ref<Error | null>}
 * @returns {Ref<boolean>}
 * @returns {Function}
 */
export function useQuery<T>(
    fetcher: Fetcher<T>,
    options: UseQueryOptions<T> = {}
) {
    const data = shallowRef<T | null>(null);
    const error = ref<Error | null>(null);
    const isPending = ref(true);

    let controller: AbortController | null = null;

    async function execute(): Promise<void> {
        // Cancel any in-flight request before starting a new one
        controller?.abort();
        controller = new AbortController();

        isPending.value = true;
        error.value = null;

        try {
            const result = await fetcher(controller.signal);
            data.value = options.transform ? options.transform(result) : result;
        } catch (err) {
            // AbortError is expected on cancel — not a real error
            if ((err as Error).name !== "AbortError") {
                error.value = err as Error;
            }
        } finally {
            isPending.value = false;
        }
    }

    if (options.watch?.length) {
        watch(options.watch, execute, { immediate: true });
    } else {
        execute();
    }

    onUnmounted(() => controller?.abort());

    return { data, error, isPending, refresh: execute };
}
