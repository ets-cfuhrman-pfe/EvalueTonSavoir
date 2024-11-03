export interface ValkeyBasicConfig{
    host:string,
    port:number
}

const valkeyDefaults : ValkeyBasicConfig = {
    host:'localhost',
    port:6379
}