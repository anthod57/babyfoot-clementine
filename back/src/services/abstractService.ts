import {
    Model,
    ModelStatic,
    FindOptions,
    CreationAttributes,
    WhereOptions,
} from "sequelize";

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
     * Update a record
     * @param {ModelStatic<T>} model
     * @param {Partial<CreationAttributes<T>>} data
     * @param {WhereOptions<T>} where
     * @returns {Promise<[number, T[] | undefined]>}
     */
    protected async update<T extends Model>(
        model: ModelStatic<T>,
        data: Partial<CreationAttributes<T>>,
        where: WhereOptions<T>
    ): Promise<[number, T[] | undefined]> {
        const [affectedCount] = await model.update(data, { where });
        return [affectedCount, await model.findAll({ where })];
    }

    /**
     * Delete a record
     * @param {ModelStatic<T>} model
     * @param {WhereOptions<T>} where
     * @returns {Promise<number>}
     */
    protected async delete<T extends Model>(
        model: ModelStatic<T>,
        where: WhereOptions<T>
    ): Promise<number> {
        return model.destroy({ where });
    }
}
