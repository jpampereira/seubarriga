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
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();

  const users = await app.db('users').insert([
    { name: 'User #1', mail: 'user1@mail.com', passwd: '$2a$10$VJpF01q6oi6Ba2a8YSiyA.2NPxqxu2cEvn9kVomgqqAYWSAEo2CsC' },
    { name: 'User #2', mail: 'user2@mail.com', passwd: '$2a$10$VJpF01q6oi6Ba2a8YSiyA.2NPxqxu2cEvn9kVomgqqAYWSAEo2CsC' },
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
      expect(res.body.ammount).toBe('450.00');
    });
});

test('Transações de entrada devem ser positivas', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user1.token}`)
    .send({ description: 'New T', date: new Date(), ammount: -450, type: 'I', acc_id: accUser1.id })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.acc_id).toBe(accUser1.id);
      expect(res.body.ammount).toBe('450.00');
    });
});

test('Transações de saída devem ser negativas', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user1.token}`)
    .send({ description: 'New T', date: new Date(), ammount: 450, type: 'O', acc_id: accUser1.id })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.acc_id).toBe(accUser1.id);
      expect(res.body.ammount).toBe('-450.00');
    });
});

describe('Ao tentar inserir uma transação válida', () => {
  const testTemplate = async (newData, errorMessage) => {
    await request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${user1.token}`)
      .send({ description: 'New T', date: new Date(), ammount: 450, type: 'I', acc_id: accUser1.id, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };

  test('Não deve inserir uma transação sem descrição', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  test('Não deve inserir uma transação sem valor', () => testTemplate({ ammount: null }, 'Valor é um atributo obrigatório'));
  test('Não deve inserir uma transação sem data', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  test('Não deve inserir uma transação sem conta', () => testTemplate({ acc_id: null }, 'Conta é um atributo obrigatório'));
  test('Não deve inserir uma transação sem tipo', () => testTemplate({ type: null }, 'Tipo é um atributo obrigatório'));
  test('Não deve inserir uma transação com tipo inválido', () => testTemplate({ type: 'A' }, 'Tipo inválido'));
});

test('Deve retornar uma transação por ID', async () => {
  await app.db('transactions')
    .insert({ description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser1.id }, '*')
    .then((transaction) => request(app).get(`${MAIN_ROUTE}/${transaction[0].id}`)
      .set('authorization', `bearer ${user1.token}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('T ID');
    });
});

test('Não deve retornar uma transação por ID de outro usuário', async () => {
  await app.db('transactions')
    .insert({ description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, '*')
    .then((transaction) => request(app).get(`${MAIN_ROUTE}/${transaction[0].id}`)
      .set('authorization', `bearer ${user1.token}`))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    });
});

test('Deve alterar uma transação', async () => {
  await app.db('transactions')
    .insert({ description: 'T to Update', date: new Date(), ammount: 100, type: 'I', acc_id: accUser1.id }, '*')
    .then((transaction) => request(app).put(`${MAIN_ROUTE}/${transaction[0].id}`)
      .set('authorization', `bearer ${user1.token}`)
      .send({ description: 'Updated' }))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated');
    });
});

test('Não deve alterar uma transação de outro usuário', async () => {
  await app.db('transactions')
    .insert({ description: 'T to Update', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, '*')
    .then((transaction) => request(app).put(`${MAIN_ROUTE}/${transaction[0].id}`)
      .set('authorization', `bearer ${user1.token}`)
      .send({ description: 'Updated' }))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    });
});

test('Deve remover uma transação', async () => {
  await app.db('transactions')
    .insert({ description: 'T to Delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser1.id }, '*')
    .then((transaction) => request(app).delete(`${MAIN_ROUTE}/${transaction[0].id}`)
      .set('authorization', `bearer ${user1.token}`)
      .send({ description: 'Updated' }))
    .then((res) => {
      expect(res.status).toBe(204);
    });
});

test('Não deve remover uma transação de outro usuário', async () => {
  await app.db('transactions')
    .insert({ description: 'T to Delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, '*')
    .then((transaction) => request(app).delete(`${MAIN_ROUTE}/${transaction[0].id}`)
      .set('authorization', `bearer ${user1.token}`)
      .send({ description: 'Updated' }))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    });
});

test('Não deve remover conta com transação', async () => {
  await app.db('transactions')
    .insert({ description: 'T to Delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser1.id }, '*')
    .then(() => request(app).delete(`/v1/accounts/${accUser1.id}`)
      .set('authorization', `bearer ${user1.token}`)
      .send({ description: 'Updated' }))
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Essa conta possui transações associadas');
    });
});
