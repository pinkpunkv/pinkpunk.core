import { object, string, TypeOf, z } from 'zod';
import {CustomerErrorCode} from '../common'
enum RoleEnumType {
  ADMIN = 'admin',
  USER = 'user',
}

export const createUserSchema = object({
  body: object({
    name: string({
      required_error: `{"code":"${CustomerErrorCode.Blank}","message":"Name is required"}`,
      
    }),
    email: string({
      required_error: `{"code":"${CustomerErrorCode.Blank}","message":"email is required"}`,
    }).email(`{"code":"${CustomerErrorCode.Invalid}","message":"invalid email"}`),
    password: string({  
      required_error: `{"code":"${CustomerErrorCode.Blank}","message":"password is required"}`
    })
      .min(8, `{"code":"${CustomerErrorCode.TooShort}","message":"password is too short"}`)
      .max(32, `{"code":"${CustomerErrorCode.TooLong}","message":"password is too long"}`),
  })
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: `{"code":"${CustomerErrorCode.Blank}","message":"email is required"}`,
    }).email(CustomerErrorCode.Invalid),
    password: string({
      required_error: `{"code":"${CustomerErrorCode.Blank}","message":"password is required"}`,
    }).min(8, `{"code":"${CustomerErrorCode.TooShort}","message":"password is too short"}`)
      .max(32, `{"code":"${CustomerErrorCode.TooLong}","message":"password is too long"}`),
  }),
});

export type CreateUserInput = Omit<
  TypeOf<typeof createUserSchema>['body'],
  'passwordConfirm'
>;

export type LoginUserInput = TypeOf<typeof loginUserSchema>['body'];

