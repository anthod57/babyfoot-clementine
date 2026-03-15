import {
    Model,
    ModelStatic,
    FindOptions,
    CreationAttributes,
    WhereOptions,
} from "sequelize";
import { NotFoundError } from "../middlewares/errorHandler";

export interface NotFoundOptions {
    notFoundMessage?: string;
}

/**
 * Abstract service class with common methods
 */
export default abstract class AbstractService {
    /**
     * Find all records of a model
     * @param {ModelStatic<T>} model
     * @param {FindOptions<T>} options
     * @returns {Promise<T[]>}
     */
    protected async findAll<T extends Model>(
        model: ModelStatic<T>,
        options?: FindOptions<T>
    ): Promise<T[]> {
        return model.findAll(options ?? {});
    }

    /**
     * Find a record by id
     * @param {ModelStatic<T>} model
     * @param {string | number} id
     * @param {FindOptions<T>} options
     * @returns {Promise<T | null>}
     */
    protected async findById<T extends Model>(
        model: ModelStatic<T>,
        id: string | number,
        options?: FindOptions<T>
    ): Promise<T | null> {
        return model.findByPk(id, options);
    }

    /**
     * Find a record by id or throw NotFoundError
     */
    protected async findByIdOrThrow<T extends Model>(
        model: ModelStatic<T>,
        id: string | number,
        findOptions?: FindOptions<T>,
        notFoundOptions?: NotFoundOptions
    ): Promise<T> {
        const record = await this.findById(model, id, findOptions);

        if (!record) {
            throw new NotFoundError(
                notFoundOptions?.notFoundMessage ?? "Resource not found"
            );
        }
        return record;
    }

    /**
     * Find a single record
     * @param {ModelStatic<T>} model
     * @param {FindOptions<T>} options
     * @returns {Promise<T | null>}
     */
    protected async findOne<T extends Model>(
        model: ModelStatic<T>,
        options: FindOptions<T>
    ): Promise<T | null> {
        return model.findOne(options);
    }

    /**
     * Create a new record
     * @param {ModelStatic<T>} model
     * @param {CreationAttributes<T>} data
     * @returns {Promise<T>}
     */
    protected async create<T extends Model>(
        model: ModelStatic<T>,
        data: CreationAttributes<T>
    ): Promise<T> {
        return model.create(data as CreationAttributes<T>);
    }

    /**
     * Update a record. Throws NotFoundError if no row was affected.
     * @returns {Promise<T>} The updated record
     */
    protected async update<T extends Model>(
        model: ModelStatic<T>,
        data: Partial<CreationAttributes<T>>,
        where: WhereOptions<T>,
        notFoundOptions?: NotFoundOptions
    ): Promise<T> {
        const [affectedCount] = await model.update(data, { where });
        if (affectedCount === 0) {
            throw new NotFoundError(
                notFoundOptions?.notFoundMessage ?? "Resource not found"
            );
        }
        const [updated] = await model.findAll({ where });
        return updated!;
    }

    /**
     * Delete a record. Throws NotFoundError if no row was deleted.
     * @returns {Promise<number>} The number of deleted rows
     */
    protected async delete<T extends Model>(
        model: ModelStatic<T>,
        where: WhereOptions<T>,
        notFoundOptions?: NotFoundOptions
    ): Promise<number> {
        const deleted = await model.destroy({ where });
        if (deleted === 0) {
            throw new NotFoundError(
                notFoundOptions?.notFoundMessage ?? "Resource not found"
            );
        }
        return deleted;
    }
}
