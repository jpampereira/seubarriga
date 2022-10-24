const ValidationError = require('../errors/validationError');

module.exports = (app) => {
  const save = (account) => {
    if (!account.name) throw new ValidationError('Nome é um atributo obrigatório');

    return app.db('accounts').insert(account, '*');
  };

  const findAll = () => app.db('accounts').select();

  const find = (filter = {}) => app.db('accounts').select().where(filter).first();

  const update = (id, account) => app.db('accounts').update(account, '*').where(id);
  
  const remove = (id) => app.db('accounts').del().where({ id });

  return {
    save, findAll, find, update, remove,
  };
};
