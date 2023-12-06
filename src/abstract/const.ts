import { parseTemplate } from 'url-template';

const DATA_URL = parseTemplate("https://graph.instagram.com/me/media?fields=id,media_type,media_url,caption,timestamp,thumbnail_url,permalink&access_token={access}");
const REFRESH_TOKEN = parseTemplate("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={access}");


export {DATA_URL, REFRESH_TOKEN, } 