import { ref, watch, onScopeDispose, type Ref } from "vue";

/**
 * Debounced ref: mirrors source after delay ms of no changes.
 * @param {Ref<T>} source
 * @param {number} [delay=300]
 * @returns {Ref<T>}
 */
export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
    const debounced = ref(source.value) as Ref<T>;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const stop = watch(
        source,
        newVal => {
            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
                debounced.value = newVal;
                timeout = null;
            }, delay);
        },
        { immediate: true }
    );

    onScopeDispose(() => {
        stop();
        if (timeout) clearTimeout(timeout);
    });

    return debounced;
}
