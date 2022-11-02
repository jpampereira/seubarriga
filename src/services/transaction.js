const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const find = (filter = {}) => app.db('transactions').select().where(filter).join('accounts', 'accounts.id', 'transactions.acc_id');

  const save = (transaction) => {
    if (!transaction.description) throw new ValidationError('Descrição é um atributo obrigatório');
    if (!transaction.ammount) throw new ValidationError('Valor é um atributo obrigatório');
    if (!transaction.date) throw new ValidationError('Data é um atributo obrigatório');
    if (!transaction.acc_id) throw new ValidationError('Conta é um atributo obrigatório');
    if (!transaction.type) throw new ValidationError('Tipo é um atributo obrigatório');
    if (['I', 'O'].indexOf(transaction.type) === -1) throw new ValidationError('Tipo inválido');

    const newTransaction = { ...transaction };
    if ((transaction.type === 'I' && transaction.ammount < 0)
      || (transaction.type === 'O' && transaction.ammount > 0)) {
      newTransaction.ammount *= -1;
    }
    
    return app.db('transactions').insert(newTransaction, '*');
  };

  const update = (id, transaction) => app.db('transactions').update(transaction, '*').where({ id });

  const remove = (id) => app.db('transactions').del().where({ id });

  return { find, save, update, remove };
};
