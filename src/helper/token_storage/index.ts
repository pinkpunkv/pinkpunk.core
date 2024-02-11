import { TokenStorage } from "./token_storage";
import path from 'path'
import root from 'app-root-path';

function token_storage() : TokenStorage{
    return TokenStorage.getInstance(path.join(path.resolve(root.path), "/static/storage.json"))
}

export {
    TokenStorage, token_storage
}