import {middleware as cache} from 'apicache'
import {CASHE_DURATION} from '../const'

export function cached(duration = CASHE_DURATION){
    return cache(duration)
}