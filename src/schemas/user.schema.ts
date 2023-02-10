import { object, string, TypeOf, z } from 'zod';
import {CustomerErrorCode} from '../common'
enum RoleEnumType {
  ADMIN = 'admin',
  USER = 'user',
}

export const createUserSchema = object({
  body: object({
    name: string({
      required_error: 'Name is required',
    }),
    email: string({
      required_error: CustomerErrorCode.Blank,
    }).email(CustomerErrorCode.Invalid),
    password: string({  
      required_error: CustomerErrorCode.Blank,
    })
      .min(8, CustomerErrorCode.TooShort)
      .max(32, CustomerErrorCode.TooLong),
  })
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: CustomerErrorCode.Blank,
    }).email(CustomerErrorCode.Invalid),
    password: string({
      required_error: CustomerErrorCode.Blank,
    }).min(8, CustomerErrorCode.Invalid),
  }),
});

export type CreateUserInput = Omit<
  TypeOf<typeof createUserSchema>['body'],
  'passwordConfirm'
>;

export type LoginUserInput = TypeOf<typeof loginUserSchema>['body'];

