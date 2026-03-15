import { apiFetch } from "./client";

/**
 * Generic base class providing standard CRUD operations.
 *
 * @template TEntity   - The full entity type returned by the API
 * @template TCreate   - Payload shape for POST requests
 * @template TUpdate   - Payload shape for PUT requests (defaults to partial create)
 */
export abstract class BaseApi<TEntity, TCreate, TUpdate = Partial<TCreate>> {
    constructor(protected readonly basePath: string) {}

    /**
     * Get all entities
     * @returns {Promise<TEntity[]>}
     */
    getAll(): Promise<TEntity[]> {
        return apiFetch<TEntity[]>(this.basePath);
    }

    /**
     * Get an entity by its id
     * @param {number} id
     * @returns {Promise<TEntity>}
     */
    getById(id: number): Promise<TEntity> {
        return apiFetch<TEntity>(`${this.basePath}/${id}`);
    }

    /**
     * Create an entity
     * @param {TCreate} payload
     * @returns {Promise<TEntity>}
     */
    create(payload: TCreate): Promise<TEntity> {
        return apiFetch<TEntity>(this.basePath, {
            method: "POST",
            body: payload,
        });
    }

    /**
     * Update an entity
     * @param {number} id
     * @param {TUpdate} payload
     * @returns {Promise<TEntity>}
     */
    update(id: number, payload: TUpdate): Promise<TEntity> {
        return apiFetch<TEntity>(`${this.basePath}/${id}`, {
            method: "PUT",
            body: payload,
        });
    }

    /**
     * Delete an entity
     * @param {number} id
     * @returns {Promise<void>}
     */
    delete(id: number): Promise<void> {
        return apiFetch<void>(`${this.basePath}/${id}`, { method: "DELETE" });
    }
}
