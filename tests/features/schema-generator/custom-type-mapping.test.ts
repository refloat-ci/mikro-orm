import { MikroORM, TextType, Type } from '@mikro-orm/core';
import { Author2, FooBaz2 } from '../../entities-sql';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author2, FooBaz2],
    dbName: `mikro_orm_test_3066`,
    type: 'postgresql',
    discovery: {
      getMappedType(type: string) {
        if (type === 'string') {
          return Type.getType(TextType);
        }
      },
    },
  });
});

afterAll(() => orm.close(true));

test('changing default type mapping (GH 3066)', async () => {
  await orm.getSchemaGenerator().ensureDatabase();
  const diff0 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
  expect(diff0).toMatchSnapshot();
});
