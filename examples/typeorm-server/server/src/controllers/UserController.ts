import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { About } from '../entities/About';

export class TempController {
  private userRepository = getRepository(About);

  async all(request: Request, response: Response, next: NextFunction) {
    return this.userRepository.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return this.userRepository.findOneById(request.params.id);
  }

  async save(request: Request, response: Response, next: NextFunction) {
    return this.userRepository.save(request.body);
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    await this.userRepository.deleteById(request.params.id);
  }
}
