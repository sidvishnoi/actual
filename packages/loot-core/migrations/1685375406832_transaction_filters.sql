BEGIN TRANSACTION;

CREATE TABLE transaction_filters
  (id TEXT PRIMARY KEY,
   name TEXT,
   conditions_op TEXT DEFAULT 'and',
   conditions TEXT,
   tombstone INTEGER DEFAULT 0);

COMMIT;
