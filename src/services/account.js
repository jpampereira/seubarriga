const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const find = (filter = {}) => app.db('accounts').select().where(filter).first();

  const findAll = (userId) => app.db('accounts').select().where({ user_id: userId });

  const save = async (account) => {
    if (!account.name) throw new ValidationError('Nome é um atributo obrigatório');

    const accDb = await find({ name: account.name, user_id: account.user_id });
    if (accDb) throw new ValidationError('Já existe uma conta com esse nome');

    return app.db('accounts').insert(account, '*');
  };

  const update = (id, account) => app.db('accounts').update(account, '*').where(id);

  const remove = async (id) => {
    const transactions = await app.services.transaction.find({ 'transactions.acc_id': id });
    if (transactions && transactions.length > 0) throw new ValidationError('Essa conta possui transações associadas');

    return app.db('accounts').del().where({ id });
  };

  return { save, findAll, find, update, remove };
};
