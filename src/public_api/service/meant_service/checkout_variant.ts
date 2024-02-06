import { CheckoutVariantId, ICRUD, PaginationParams } from '@abstract/types';
import { PrismaClient, Prisma, CheckoutVariants } from '@prisma/client'


export default function make_checkout_variant_service(db_connection:PrismaClient): ICRUD<CheckoutVariants, CheckoutVariantId>{
    return Object.freeze({
        create,
        update,
        remove,
        get,
        get_all
    });

    async function create(entity: CheckoutVariants): Promise<CheckoutVariants> {
        return await db_connection.checkoutVariants.create({
            data: entity
        })
    }
    async function update(id: CheckoutVariantId, entity: CheckoutVariants): Promise<CheckoutVariants> {
        return await db_connection.checkoutVariants.update({
            where:{checkoutId_variantId: id},
            data:entity
        })
    }
    async function get(id: CheckoutVariantId): Promise<CheckoutVariants> {
        return await db_connection.checkoutVariants.findFirstOrThrow({
            where:{checkoutId: id.checkoutId, variantId: id.variantId}
        })
    }
    async function get_all(params: PaginationParams): Promise<CheckoutVariants[]> {
        return await db_connection.checkoutVariants.findMany({
            skip: params.skip,
            take: params.take
        })
    }

    async function remove(id: CheckoutVariantId): Promise<CheckoutVariants> {
        return await db_connection.checkoutVariants.delete({
            where:{checkoutId_variantId:id},
        })
    }
}