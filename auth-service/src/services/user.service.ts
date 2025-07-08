// src/repositories/user.repository.ts
import { Injectable } from "@nestjs/common";
import { UserRepository } from "@Repository/users.repository";

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }
}
