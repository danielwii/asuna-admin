import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AbstractBaseEntity } from './AbstractBaseEntity';
import { About } from './About';

@Entity('t_about_categories')
@Index(
  'index_with_name',
  (aboutCategory: AboutCategory) => [aboutCategory.name],
  { unique: true },
)
export class AboutCategory extends AbstractBaseEntity {

  @Column({ nullable: false, length: 100, name: 'name' })
  name: string;

  @Column({ nullable: true, length: 100, name: 'name_en' })
  nameEn: string;

  @Column('text', { nullable: true, name: 'description' })
  description: string;

  @OneToMany(type => About, about => about.aboutCategory)
  about: About[];

}
