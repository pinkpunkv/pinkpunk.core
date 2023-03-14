
import type { AddressFields } from './customer/address'
import type { Card, CardFields } from './customer/card'
import type { LineItem } from './cart'

export interface Checkout {
  /**
   * Indicates if the checkout has payment iformation collected.
   */
  hasPayment: boolean
  /**
   * Indicates if the checkout has shipping information collected.
   */
  hasShipping: boolean
  /**
   * The unique identifier for the address that the customer has selected for shipping.
   */
  addressId: string
  /**
   * The list of payment cards that the customer has available.
   */
  payments?: Card[]
  /**
   * The unique identifier of the card that the customer has selected for payment.
   */
  cardId?: string
  /**
   * List of items in the checkout.
   */
  lineItems?: LineItem[]
}

export interface CheckoutBody {
  /**
   * The unique identifier for the cart.
   */
  cartId?: string
  /**
   * The Card information.
   * @see CardFields
   */
  card: CardFields
  /**
   * The Address information.
   * @see AddressFields
   */
  address: AddressFields
}


