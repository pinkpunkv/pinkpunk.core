import { TokenStorage } from "./token_storage";

function token_storage(file_path: string) : TokenStorage{
    console.log(file_path)
    return TokenStorage.getInstance(file_path)
}

export {
    TokenStorage, token_storage
}