import { ProductImage, Image } from './common'
import { Category } from './site'

export interface ProductPrice {
  /**
   * The price after all discounts are applied.
   */
  value: number
  /**
   * The currency code for the price. This is a 3-letter ISO 4217 code.
   * @example USD
   */
  currencyCode?: 'USD' | 'EUR' | 'ARS' | 'GBP' | string
  /**
   * The retail price of the product. This can be used to mark a product as on sale, when `retailPrice` is higher than the price a.k.a `value`.
   */
  retailPrice?: number
}

export interface ProductOption {
  __typename?: 'MultipleChoiceOption'
  /**
   * The unique identifier for the option.
   */
  id: string
  /**
   * The product option’s name.
   * @example `Color` or `Size`
   */
  displayName: string
  /**
   * List of option values.
   * @example `["Red", "Green", "Blue"]`
   */
  values: ProductOptionValues[]
}
export interface Tag {
  id: number
  tag: string
}

export interface ProductOptionValues {
  /**
   * A string that uniquely identifies the option value.
   */
  label: string
  /**
   * List of hex colors used to display the actual colors in the swatches instead of the name.
   */
  hexColors?: string[]
}

export interface ProductVariant {
  id: number
  productId: number
  size: string
  color: string
  options: ProductOption[]
  count: number
  images: string[]
  basePrice?: string
  currencySymbol?: string
}

export interface Product {
  id: string
  name: string
  description: string
  descriptionHtml?: string
  slug?: string
  path?: string
  basePrice?: string
  images: ProductImage[]
  tags: Tag[]
  categories: Category
  variants: ProductVariant[]
  price: ProductPrice
  options: ProductOption[]
  currencySymbol: string
  collectionId?: number
  collection?: Collection
  vendor?: string
}
export interface Collection {
  id: number
  name: string
}
export interface SearchProductsBody {
  /**
   * The search query string to filter the products by.
   */
  search?: string
  /**
   * The category ID to filter the products by.
   */
  categoryId?: string
  /**
   * The brand ID to filter the products by.
   */
  brandId?: string
  /**
   * The sort key to sort the products by.
   * @example 'trending-desc' | 'latest-desc' | 'price-asc' | 'price-desc'
   */
  orderBy?: string
  /**
   * The locale code, used to localize the product data (if the provider supports it).
   */
  locale?: string
  sizes?: string
  colors?: string
  sex?: string
  minPrice?: string
  maxPrice?: string
}

/**
 * Fetches a list of products based on the given search criteria.
 */
export type SearchProductsHook = {
  data: {
    categories?: any
    /**
     * List of products matching the query.
     */
    products: Product[]
    /**
     * Indicates if there are any products matching the query.
     */
    found: boolean
  }
  body: SearchProductsBody
  input: SearchProductsBody
  fetcherInput: SearchProductsBody
}

/**
 * Product API schema
 */

export type ProductsSchema = {
  endpoint: {
    options: {}
    handlers: {
      getProducts: SearchProductsHook
    }
  }
}

/**
 *  Product operations
 */

export type GetAllProductPathsOperation = {
  data: { products: Pick<Product, 'path'>[] }
  variables: { first?: number }
}

export type GetAllProductsOperation = {
  data: { products: Product[] }
  variables: {
    relevance?: 'featured' | 'best_selling' | 'newest'
    ids?: string[]
    first?: number
  }
}

export type GetProductOperation = {
  data: { product?: Product }
  variables: { path: string; slug?: never } | { path?: never; slug: string }
}

export interface Filters {
  sizes: String[]
  colors: String[]
  min: Number
  max: Number
}

export type GetFiltersOperation = {
  data: { filters?: Filters }
}
export type GetPostsOperation = {
  data: any
}
