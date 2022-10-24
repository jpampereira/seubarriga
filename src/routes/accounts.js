module.exports = (app) => {
  const create = (req, res, next) => {
    app.services.account
      .save(req.body)
      .then((result) => res.status(200).json(result[0]))
      .catch((err) => next(err));
  };

  const findAll = (req, res, next) => {
    app.services.account.findAll()
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  };

  const find = (req, res, next) => {
    app.services.account.find({ id: req.params.id })
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  };

  const update = (req, res, next) => {
    app.services.account.update({ id: req.params.id }, req.body)
      .then((result) => res.status(200).json(result[0]))
      .catch((err) => next(err));
  };

  const remove = (req, res, next) => {
    app.services.account.remove(req.params.id)
      .then(() => res.status(204).send())
      .catch((err) => next(err));
  };

  return {
    create, findAll, find, update, remove,
  };
};
