import { getRepository } from 'typeorm';
import {
  Body,
  Get,
  HeaderParam,
  JsonController,
  Param,
  Patch,
  Post
} from "routing-controllers";
import * as R from "ramda";

@JsonController()
export class RestController {
  @Get("/rest/:model")
  list(
    @Param("model") model: string,
    @HeaderParam("prefix") prefix: string = "t_"
  ) {
    return getRepository(`${prefix}${model}`).find();
  }

  @Get("/rest/:model/:id")
  get(
    @Param("model") model: string,
    @Param("id") id: number,
    @HeaderParam("prefix") prefix: string = "t_"
  ) {
    const repository = getRepository(`${prefix}${model}`);
    const relations = repository.metadata.relations.map(r => r.propertyName);
    return repository.findOneById(id, { relations });
  }

  @Post("/rest/:model")
  save(
    @Param("model") model: string,
    @Body() updateTo,
    @HeaderParam("prefix") prefix: string = "t_"
  ) {
    return getRepository(`${prefix}${model}`).save(updateTo);
  }

  @Patch("/rest/:model/:id")
  async patch(
    @Param("model") model: string,
    @Param("id") id: number,
    @Body() updateTo,
    @HeaderParam("prefix") prefix: string = "t_"
  ) {
    const repository = getRepository(`${prefix}${model}`);
    const relationKeys = repository.metadata.relations.map(r => r.propertyName);
    const relations = R.map(value => ({ id: value }))(
      R.pick(relationKeys)(updateTo)
    );
    const entityTo = R.mergeAll([{ id }, updateTo, relations]);
    await repository.save({ ...entityTo, ...relations });
    return repository.findOneById(id);
  }
}
