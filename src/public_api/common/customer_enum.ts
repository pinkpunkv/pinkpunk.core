export enum CustomerErrorCode {
  Blank = 'BLANK',
  Invalid = 'INVALID',
  Taken = 'TAKEN',
  TooLong = 'TOO_LONG',
  TooShort = 'TOO_SHORT',
  TooManyRequests = 'TOO_MANY_REQUESTS',
  UnidentifiedCustomer = 'UNIDENTIFIED_CUSTOMER',
  CustomerDisabled = 'CUSTOMER_DISABLED',
  PasswordStartsOrEndsWithWhitespace = 'PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE',
  ContainsHtmlTags = 'CONTAINS_HTML_TAGS',
  ContainsUrl = 'CONTAINS_URL',
  TokenInvalid = 'TOKEN_INVALID',
  AlreadyEnabled = 'ALREADY_ENABLED',
  NotFound = 'NOT_FOUND',
  BadDomain = 'BAD_DOMAIN',
  InvalidMultipassRequest = 'INVALID_MULTIPASS_REQUEST',
  Forbidden = "HOS NO ACCESS TO RESOURCE"
}