/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    -- Ensure columns on subscriptions match Phase 17 state machine & subscription_plans relation
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE RESTRICT;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS past_due_until TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;

    -- Ensure indexes for subscriptions
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

    -- Ensure indexes for payment_orders
    CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_code ON payment_orders(order_code);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_payment_orders_status;
    DROP INDEX IF EXISTS idx_payment_orders_code;
    DROP INDEX IF EXISTS idx_payment_orders_user;
    DROP INDEX IF EXISTS idx_subscriptions_end_date;
    DROP INDEX IF EXISTS idx_subscriptions_user_status;
    
    ALTER TABLE subscriptions DROP COLUMN IF EXISTS auto_renew;
    ALTER TABLE subscriptions DROP COLUMN IF EXISTS past_due_until;
    ALTER TABLE subscriptions DROP COLUMN IF EXISTS cancelled_at;
    ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan_id;
  `);
};
