const request = require('supertest');
const jwt = require('jwt-simple');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';
let user1;
let user2;
let accUser1;
let accUser2;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('accounts').del();
  await app.db('users').del();

  const users = await app.db('users').insert([
    { name: 'User #1', mail: 'user1@mail.com', passwd: '"$2a$10$VJpF01q6oi6Ba2a8YSiyA.2NPxqxu2cEvn9kVomgqqAYWSAEo2CsC"' },
    { name: 'User #2', mail: 'user2@mail.com', passwd: '"$2a$10$VJpF01q6oi6Ba2a8YSiyA.2NPxqxu2cEvn9kVomgqqAYWSAEo2CsC"' },
  ], '*');
  [user1, user2] = users;

  delete user1.passwd;
  user1.token = jwt.encode(user1, 'Segredo');

  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user1.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');
  [accUser1, accUser2] = accs;
});

test('Deve listar apenas as transações do usuário', async () => {
  await app.db('transactions').insert([
    { description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: accUser1.id },
    { description: 'T2', date: new Date(), ammount: 300, type: 'O', acc_id: accUser2.id },
  ]).then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user1.token}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('T1');
    });
});

test('Deve inserir uma transação com sucesso', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user1.token}`)
    .send({ description: 'New T', date: new Date(), ammount: 450, type: 'I', acc_id: accUser1.id })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.acc_id).toBe(accUser1.id);
    });
});
