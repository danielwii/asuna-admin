import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Get, JsonController, Patch, Post, Put } from "routing-controllers";

import { About } from "../entities/About";
import {
  EntityFromBody,
  EntityFromParam
} from "typeorm-routing-controllers-extensions";

@JsonController()
export class AboutController {
  private aboutRepository = getRepository(About);

  @Get("/api/v1/abouts")
  list() {
    return this.aboutRepository.find();
  }

  @Get("/api/v1/abouts/:id")
  get(@EntityFromParam("id") about: About) {
    return about;
  }

  @Post("/api/v1/abouts")
  save(@EntityFromBody() about: About) {
    return this.aboutRepository.save(about);
  }

  @Put("/api/v1/abouts/:id")
  put(@EntityFromParam("id") about: About, @EntityFromBody() updateTo: About) {
    return this.aboutRepository.save({ ...about, ...updateTo });
  }

  @Patch("/api/v1/abouts/:id")
  patch(
    @EntityFromParam("id") about: About,
    @EntityFromBody() updateTo: About
  ) {
    return this.aboutRepository.save({ ...about, ...updateTo });
  }
}
