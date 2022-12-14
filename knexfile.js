module.exports = {
  test: {
    client: 'pg',
    version: 14.1,
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      database: 'barriga',
    },
    migrations: { directory: 'src/migrations' },
    seeds: { directory: 'src/seeds' },
  },
  prod: {
    client: 'pg',
    version: 14.1,
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      database: 'seubarriga',
    },
    migrations: { directory: 'src/migrations' },
  },
};
