export enum CheckoutErrorCode {
    Blank = 'BLANK',
    Invalid = 'INVALID',
    TooLong = 'TOO_LONG',
    Present = 'PRESENT',
    LessThan = 'LESS_THAN',
    GreaterThanOrEqualTo = 'GREATER_THAN_OR_EQUAL_TO',
    LessThanOrEqualTo = 'LESS_THAN_OR_EQUAL_TO',
    AlreadyCompleted = 'ALREADY_COMPLETED',
    Locked = 'LOCKED',
    NotSupported = 'NOT_SUPPORTED',
    BadDomain = 'BAD_DOMAIN',
    InvalidForCountry = 'INVALID_FOR_COUNTRY',
    InvalidForCountryAndProvince = 'INVALID_FOR_COUNTRY_AND_PROVINCE',
    InvalidStateInCountry = 'INVALID_STATE_IN_COUNTRY',
    
    InvalidProvinceInCountry = 'INVALID_PROVINCE_IN_COUNTRY',
    
    InvalidRegionInCountry = 'INVALID_REGION_IN_COUNTRY',
    
    ShippingRateExpired = 'SHIPPING_RATE_EXPIRED',
    
    GiftCardUnusable = 'GIFT_CARD_UNUSABLE',
    
    GiftCardDisabled = 'GIFT_CARD_DISABLED',
   
    GiftCardCodeInvalid = 'GIFT_CARD_CODE_INVALID',
    
    GiftCardAlreadyApplied = 'GIFT_CARD_ALREADY_APPLIED',
    
    GiftCardCurrencyMismatch = 'GIFT_CARD_CURRENCY_MISMATCH',
    
    GiftCardExpired = 'GIFT_CARD_EXPIRED',
   
    GiftCardDepleted = 'GIFT_CARD_DEPLETED',
    
    GiftCardNotFound = 'GIFT_CARD_NOT_FOUND',
    CartDoesNotMeetDiscountRequirementsNotice = 'CART_DOES_NOT_MEET_DISCOUNT_REQUIREMENTS_NOTICE',
    
    DiscountExpired = 'DISCOUNT_EXPIRED',
    
    DiscountDisabled = 'DISCOUNT_DISABLED',
    
    DiscountLimitReached = 'DISCOUNT_LIMIT_REACHED',
    
    DiscountNotFound = 'DISCOUNT_NOT_FOUND',
   
    CustomerAlreadyUsedOncePerCustomerDiscountNotice = 'CUSTOMER_ALREADY_USED_ONCE_PER_CUSTOMER_DISCOUNT_NOTICE',
    
    Empty = 'EMPTY',
   
    NotEnoughInStock = 'NOT_ENOUGH_IN_STOCK',
   
    MissingPaymentInput = 'MISSING_PAYMENT_INPUT',
    
    TotalPriceMismatch = 'TOTAL_PRICE_MISMATCH',
    
    LineItemNotFound = 'LINE_ITEM_NOT_FOUND',
    
    UnableToApply = 'UNABLE_TO_APPLY',
    
    DiscountAlreadyApplied = 'DISCOUNT_ALREADY_APPLIED',
  }