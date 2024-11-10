import User from "../models/user-model";
import BaseRepository from "./base-repository";

class UserRepository extends BaseRepository<User> {
  constructor(db) {
    super(db, "users");
  }
}

export default UserRepository;