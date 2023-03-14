import { number } from 'zod'

export interface Discount {
  /**
   * The value of the discount, can be an amount or percentage.
   */
  value: number
}

export interface Measurement {
  /**
   * The measurement's value.
   */
  value: number
  /**
   * The measurement's unit, such as "KILOGRAMS", "GRAMS", "POUNDS" & "OOUNCES".
   */
  unit: 'KILOGRAMS' | 'GRAMS' | 'POUNDS' | 'OUNCES'
}

export interface Image {
  id: number
  url: string
  alt?: string
}

export interface ProductImage {
  url: string
  alt: string
  isMain: boolean
  number: number
}
