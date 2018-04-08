import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractBaseEntity } from './AbstractBaseEntity';
import { AboutCategory } from './AboutCategory';

import { MetaInfo } from '../decorators/meta.decorator';

@Entity('t_abouts')
export class About extends AbstractBaseEntity {

  @MetaInfo({ name: 'kitty' })
  @Column({ nullable: true, length: 255, name: 'name' })
  name: string;

  @Column('int', { nullable: true, name: 'ordinal' })
  ordinal: number;

  @Column({ nullable: true, length: 255, name: 'image' })
  image: string;

  @Column({ nullable: true, length: 255, name: 'image_alt' })
  imageAlt: string;

  @Column({ nullable: true, name: 'published' })
  isPublished: boolean;

  @Column('date', { nullable: true, name: 'setup_time' })
  setupTime: string;

  @ManyToOne(type => AboutCategory, aboutCategory => aboutCategory.about)
  @JoinColumn({ name: 'about_category_id' })
  aboutCategory: AboutCategory;

}
