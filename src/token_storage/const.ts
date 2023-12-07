let DATA_URL = "https://graph.instagram.com/me/media?fields=id,media_type,media_url,caption,timestamp,thumbnail_url,permalink&access_token={access_token}";

let RENEW_TOKEN_URL = "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={access_token}";

export {DATA_URL, RENEW_TOKEN_URL} 