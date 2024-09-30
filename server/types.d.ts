// Authentication middleware has user property added to the request object. 
// https://stackoverflow.com/a/62631740/1168342
declare namespace Express {
    export interface Request {
        user: any;
    }
    export interface Response {
        user: any;
    }
  }
