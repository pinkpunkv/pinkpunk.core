import { ICRUD, PaginationParams } from '@abstract/types';
import { PrismaClient, Variant } from '@prisma/client'


export default function make_variant_service(db_connection:PrismaClient): ICRUD<Variant, number>{
    return Object.freeze({
        create,
        update,
        remove,
        get,
        get_all
    });

    async function create(entity: Variant): Promise<Variant> {
        return await db_connection.variant.create({
            data: entity
        })
    }
    async function update(id: number, entity: Variant): Promise<Variant> {
        return await db_connection.variant.update({
            where:{id:id},
            data:entity
        })
    }
    async function get(id: number): Promise<Variant> {
        return await db_connection.variant.findFirstOrThrow({
            where:{id: id}
        })
    }
    async function get_all(params: PaginationParams): Promise<Variant[]> {
        return await db_connection.variant.findMany({
            skip: params.skip,
            take: params.take
        })
    }

    async function remove(id: number): Promise<Variant> {
        return await db_connection.variant.delete({
            where:{id:id},
        })
    }
}