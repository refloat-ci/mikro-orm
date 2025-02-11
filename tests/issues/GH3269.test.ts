import { Entity, MikroORM, PrimaryKey, Property, ManyToOne, PrimaryKeyType } from '@mikro-orm/core';

@Entity()
class Main {

  @Property({ primary: true })
  pk_one!: string;

  @Property({ primary: true })
  pk_two!: string;

  [PrimaryKeyType]?: [string, string];

  @Property()
  type!: string;

}

@Entity()
class Dependent {

  @ManyToOne(() => Main, { primary: true })
  main!: Main;

  @PrimaryKey()
  id!: string;

  [PrimaryKeyType]?: [string, string, string];

  @Property()
  bar!: string;

}

@Entity()
class LogEntry {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Dependent, { onDelete: 'cascade' })
  dependent!: Dependent;

  @Property()
  foo!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    type: 'better-sqlite',
    dbName: ':memory:',
    entities: [LogEntry],
  });
  await orm.getSchemaGenerator().createSchema();
});
beforeEach(async () => orm.getSchemaGenerator().clearDatabase());
afterAll(() => orm.close(true));

test('GH #3269', async () => {
  // Create some entities
  const main = orm.em.create(Main, {
    pk_one: 'one-1',
    pk_two: 'two-1',
    type: 'some-type',
  });

  const dependent = orm.em.create(Dependent, {
    id: 'app-1',
    main,
    bar: 'some-bar',
  });

  const logEntry = orm.em.create(LogEntry, {
    dependent,
    foo: 'some-foo',
  });

  await orm.em.persist([main, dependent, logEntry]).flush();
  orm.em.clear();

  // Loading with `populate` from `Dependent` fully populates `Main`.
  const result1 = await orm.em.findOneOrFail(Dependent, { id: 'app-1' }, { populate: ['main'] });
  expect(result1.main.type).toBe('some-type');
  orm.em.clear();

  // Loading with `populate` from `LogEntry` fails to fully populate `Main`.
  const result2 = await orm.em.findOneOrFail(LogEntry, { id: 1 }, { populate: ['dependent.main'] });
  expect(result2.dependent.main.type).toBe('some-type');
});
