import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom-v5-compat';

import {
  format as formatDate,
  isValid as isValidDate,
  parse as parseDate,
  parseISO,
} from 'date-fns';
import memoizeOne from 'memoize-one';
import { bindActionCreators } from 'redux';

import * as actions from 'loot-core/src/client/actions';
import {
  getAccountsById,
  getPayeesById,
} from 'loot-core/src/client/reducers/queries';
import { send } from 'loot-core/src/platform/client/fetch';
import * as monthUtils from 'loot-core/src/shared/months';
import {
  splitTransaction,
  updateTransaction,
  addSplitTransaction,
  // deleteTransaction,
  realizeTempTransactions,
} from 'loot-core/src/shared/transactions';
import {
  getChangedValues,
  diffItems,
  amountToInteger,
  integerToAmount,
  integerToCurrency,
} from 'loot-core/src/shared/util';

import Add from '../../icons/v1/Add';
import Trash from '../../icons/v1/Trash';
import PencilWriteAlternate from '../../icons/v2/PencilWriteAlternate';
import { colors, styles } from '../../style';
import { Button, Text, TextOneLine, View } from '../common';
import ExitTransition from '../ExitTransition';
import {
  BooleanField,
  EDITING_PADDING,
  FieldLabel,
  InputField,
  TapField,
} from '../forms';
import ChildEdit from '../transactions/ChildEdit';
import { AmountInput } from '../util/AmountInput';

export function MobileTransactionEdit(props) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState(props.transactions);
  const [editingChild, setEditingChild] = useState(null);
  const [queuedChange, setQueuedChange] = useState(null);
  const amountRef = useRef(null);
  const lastChildAmountRef = useRef(null);

  const serializeTransactions = memoizeOne(transactions => {
    return transactions.map(t => serializeTransaction(t, props.dateFormat));
  });

  useEffect(() => {
    if (props.adding) {
      amountRef.current.focus();
    }
  });

  const openChildEdit = child => {
    setEditingChild(child.id);
  };

  const onAdd = () => {
    onSave();
  };

  const _onCancel = () => {
    navigate(-1);
  };

  const onSave = async () => {
    if (transactions.find(t => t.account == null)) {
      // Ignore transactions if any of them don't have an account
      return;
    }

    // Since we don't own the state, we have to handle the case where
    // the user saves while editing an input. We won't have the
    // updated value so we "apply" a queued change. Maybe there's a
    // better way to do this (lift the state?)
    if (queuedChange) {
      let [transaction, name, value] = queuedChange;
      const updatedTransactions = await onEdit(transaction, name, value);
      setTransactions(updatedTransactions);
    }

    if (props.adding) {
      setTransactions(realizeTempTransactions(transactions));
    }

    props.onSave(transactions);
    navigate(-1);
  };

  const onSaveChild = _childTransaction => setEditingChild(null);

  const onEdit = async (transaction, name, value) => {
    let newTransaction = { ...transaction, [name]: value };
    if (props.onEdit) {
      newTransaction = await props.onEdit(newTransaction);
    }

    let { data: newTransactions } = updateTransaction(
      transactions,
      deserializeTransaction(newTransaction, null, props.dateFormat),
    );

    setQueuedChange(null);
    setTransactions(newTransactions);
    return newTransactions;
  };

  const onQueueChange = (transaction, name, value) => {
    // This is an ugly hack to solve the problem that input's blur
    // events are not fired when unmounting. If the user has focused
    // an input and swipes back, it should still save, but because the
    // blur event is not fired we need to manually track the latest
    // change and apply it ourselves when unmounting
    setQueuedChange([transaction, name, value]);
  };

  const onTap = (transactionId, name) => {
    let { navigation, dateFormat } = props;

    console.log(`ye olde onTap: ${transactionId} ${name}`);
    if (navigation) {
      switch (name) {
        case 'category':
          navigation.navigate('CategorySelect', {
            onSelect: id => {
              let transaction = transactions.find(t => t.id === transactionId);
              // This is a deficiency of this API, need to fix. It
              // assumes that it receives a serialized transaction,
              // but we only have access to the raw transaction
              onEdit(serializeTransaction(transaction, dateFormat), name, id);
            },
          });
          break;
        case 'account':
          navigation.navigate('AccountSelect', {
            title: 'Select an account',
            onSelect: id => {
              let transaction = transactions.find(t => t.id === transactionId);
              // See above
              onEdit(serializeTransaction(transaction, dateFormat), name, id);
            },
          });
          break;
        case 'payee':
          navigation.navigate('PayeeSelect', {
            onSelect: id => {
              let transaction = transactions.find(t => t.id === transactionId);
              // See above
              onEdit(serializeTransaction(transaction, dateFormat), name, id);
            },
          });
          break;
        default:
      }
    }
  };

  const onSplit = () => {
    props.navigation.navigate('CategorySelect', {
      title: 'Select the first category',
      onSelect: categoryId => {
        // Split the transaction
        let { data } = splitTransaction(transactions, transactions[0].id);
        data[1].category = categoryId;

        // TODO: focus after set state...
        // this.setState({ transactions: data }, this.focusSplit);
        setTransactions(data);
        focusSplit();
      },
    });
  };

  const onAddSplit = () => {
    props.navigation.navigate('CategorySelect', {
      title: 'Select a category',
      onSelect: categoryId => {
        // Split the transaction
        let { data } = addSplitTransaction(transactions, transactions[0].id);
        // Set the initial category
        data[data.length - 1].category = categoryId;

        // this.setState({ transactions: data }, this.focusSplit);
        setTransactions(data);
        focusSplit();
      },
    });
  };

  const focusSplit = () => {
    if (lastChildAmountRef.current) {
      lastChildAmountRef.current.focus();
    }
  };

  // const onDeleteSplit = transaction => {
  //   let { data } = deleteTransaction(transactions, transaction.id);
  //   setTransactions(data);
  // };

  // renderActions = (progress, dragX) => {
  //   const trans = dragX.interpolate({
  //     inputRange: [-101, -100, -50, 0],
  //     outputRange: [-6, -5, -5, 20],
  //   });
  //   return (
  //     <Button
  //       onPress={this.close}
  //       style={{
  //         flex: 1,
  //         justifyContent: 'center',
  //         backgroundColor: colors.r4,
  //       }}
  //     >
  //       {/* Animated.Text */}
  //       <Text
  //         style={{
  //           color: 'white',
  //           textAlign: 'right',
  //           transform: [{ translateX: trans }],
  //         }}
  //       >
  //         Delete
  //       </Text>
  //     </Button>
  //   );
  // };

  console.log('rendering new transaction view');
  const {
    adding,
    categories,
    accounts,
    payees,
    renderChildEdit,
    navigation,
    onDelete,
  } = props;
  const serializedTransactions = serializeTransactions(transactions || []);
  const [transaction, ...childTransactions] = serializedTransactions;
  const { payee: payeeId, category, account: accountId } = transaction;

  // Child transactions should always default to the signage
  // of the parent transaction
  let forcedSign = transaction.amount < 0 ? 'negative' : 'positive';

  let account = getAccountsById(accounts)[accountId];
  let payee = payees && payeeId && getPayeesById(payees)[payeeId];
  let transferAcct =
    payee &&
    payee.transfer_acct &&
    getAccountsById(accounts)[payee.transfer_acct];

  let descriptionPretty = getDescriptionPretty(
    transaction,
    payee,
    transferAcct,
  );

  return (
    // <KeyboardAvoidingView>
    <View
      style={{
        margin: 10,
        marginTop: 3,
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 4,

        // This shadow make the card "pop" off of the screen below it
        shadowColor: colors.n3,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 4,
        shadowOpacity: 1,
      }}
    >
      <View style={{ borderRadius: 4, overflow: 'hidden', flex: 1 }}>
        <View
          style={{
            borderBottomWidth: 1,
            borderColor: colors.n9,
            flexDirection: 'row',
            justifyContent: 'center',
            padding: 15,
          }}
        >
          <TextOneLine
            centered={true}
            style={[styles.header.headerTitleStyle, { marginHorizontal: 30 }]}
          >
            {payeeId == null
              ? adding
                ? 'New Transaction'
                : 'Transaction'
              : descriptionPretty}
          </TextOneLine>
        </View>

        {/* <ScrollView
            ref={el => (this.scrollView = el)}
            automaticallyAdjustContentInsets={false}
            keyboardShouldPersistTaps="always"
            style={{
              backgroundColor: colors.n11,
              flexGrow: 1,
              overflow: 'hidden',
            }}
            contentContainerStyle={{ flexGrow: 1 }}
          > */}
        <View
          style={{
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <FieldLabel
            title="Amount"
            flush
            style={{ marginBottom: 0, paddingLeft: 0 }}
          />
          <AmountInput
            ref={amountRef}
            value={transaction.amount}
            zeroIsNegative={true}
            onBlur={value => onEdit(transaction, 'amount', value.toString())}
            onChange={value => onQueueChange(transaction, 'amount', value)}
            style={{ height: 37, transform: [] }}
            focusedStyle={{
              width: 'auto',
              padding: '0 10',
              minWidth: 120,
              transform: [{ translateY: -0.5 }],
            }}
            textStyle={{ fontSize: 30, textAlign: 'center' }}
          />
        </View>

        <FieldLabel title="Payee" flush />
        <TapField
          value={descriptionPretty}
          onTap={() => this.onTap(transaction.id, 'payee')}
        />

        <View>
          <FieldLabel
            title={transaction.is_parent ? 'Categories (split)' : 'Category'}
          />
          {!transaction.is_parent ? (
            <TapField
              value={category ? lookupName(categories, category) : null}
              disabled={(account && !!account.offbudget) || transferAcct}
              rightContent={
                <Button
                  contentStyle={{
                    paddingInline: '4 15',
                    margin: 0,
                  }}
                  onPress={onSplit}
                >
                  Split
                </Button>
              }
              onTap={() => this.onTap(transaction.id, 'category')}
            />
          ) : (
            <View>
              {childTransactions.map((child, idx) => {
                const isLast = idx === childTransactions.length - 1;
                return (
                  // <Swipeable
                  //   key={child.id}
                  //   renderRightActions={this.renderActions}
                  //   onSwipeableRightOpen={() => this.onDeleteSplit(child)}
                  //   rightThreshold={100}
                  // >
                  <TapField
                    value={
                      child.category
                        ? lookupName(categories, child.category)
                        : null
                    }
                    rightContent={
                      <AmountInput
                        ref={isLast ? lastChildAmountRef : null}
                        value={child.amount}
                        sign={forcedSign}
                        scrollIntoView={true}
                        buttonProps={{
                          paddingTop: 5,
                          paddingBottom: 5,
                          style: {
                            width: 80,
                            alignItems: 'flex-end',
                          },
                        }}
                        textStyle={{ fontSize: 14 }}
                        onBlur={value =>
                          this.onEdit(child, 'amount', value.toString())
                        }
                      />
                    }
                    style={{ marginTop: idx === 0 ? 0 : -1 }}
                    onTap={() => openChildEdit(child)}
                  />
                  // </Swipeable>
                );
              })}

              <View
                style={{
                  alignItems: 'flex-end',
                  marginRight: EDITING_PADDING,
                  paddingTop: 10,
                }}
              >
                {transaction.error && (
                  <Text style={{ marginBottom: 10 }}>
                    Remaining: {integerToCurrency(transaction.error.difference)}
                  </Text>
                )}
                <Button
                  contentStyle={{
                    paddingVertical: 6,
                    paddingInline: 15,
                  }}
                  onPress={onAddSplit}
                >
                  Add split
                </Button>
              </View>
            </View>
          )}
        </View>

        <FieldLabel title="Account" />
        <TapField
          disabled={!adding}
          value={account ? account.name : null}
          onTap={() => onTap(transaction.id, 'account')}
        />

        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <FieldLabel title="Date" />
            <InputField
              defaultValue={transaction.date}
              onUpdate={value => onEdit(transaction, 'date', value)}
              onChange={e =>
                onQueueChange(transaction, 'date', e.nativeEvent.text)
              }
            />
          </View>

          <View style={{ marginInline: 35 }}>
            <FieldLabel title="Cleared" />
            <BooleanField
              value={transaction.cleared}
              onUpdate={value => onEdit(transaction, 'cleared', value)}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        <FieldLabel title="Notes" />
        <InputField
          defaultValue={transaction.notes}
          onUpdate={value => onEdit(transaction, 'notes', value)}
          onChange={e =>
            onQueueChange(transaction, 'notes', e.nativeEvent.text)
          }
        />

        {!adding && (
          <View style={{ alignItems: 'center' }}>
            <Button
              onPress={() => onDelete()}
              style={{
                paddingVertical: 5,
                margin: `20 ${EDITING_PADDING} 15`,
                backgroundColor: 'transparent',
              }}
              contentStyle={{ borderWidth: 0 }}
            >
              <Trash width={17} height={17} style={{ color: colors.r4 }} />
              <Text style={{ color: colors.r4, marginLeft: 5 }}>
                Delete transaction
              </Text>
            </Button>
          </View>
        )}
        {/* </ScrollView> */}

        <View
          style={{
            padding: `15 ${EDITING_PADDING}`,
            backgroundColor: colors.n11,
            borderTopWidth: 1,
            borderColor: colors.n10,
          }}
        >
          {adding ? (
            <Button onPress={() => onAdd()}>
              <Add width={17} height={17} style={{ color: colors.b3 }} />
              <Text style={[styles.text, { color: colors.b3, marginLeft: 5 }]}>
                Add transaction
              </Text>
            </Button>
          ) : (
            <Button onPress={() => onSave()}>
              <PencilWriteAlternate
                style={{ width: 16, height: 16, color: colors.n1 }}
              />
              <Text style={[styles.text, { marginLeft: 6, color: colors.n1 }]}>
                Save changes
              </Text>
            </Button>
          )}
        </View>

        <ExitTransition
          alive={editingChild}
          withProps={{
            transaction:
              editingChild &&
              serializedTransactions.find(t => t.id === editingChild),
          }}
        >
          {(exiting, onDone, { transaction }) =>
            renderChildEdit({
              transaction,
              exiting,
              amountSign: forcedSign,
              getCategoryName: id => (id ? lookupName(categories, id) : null),
              navigation,
              onEdit: onEdit,
              onStartClose: onSaveChild,
              onClose: onDone,
            })
          }
        </ExitTransition>
      </View>
    </View>
    // </KeyboardAvoidingView>
  );
}

function serializeTransaction(transaction, dateFormat) {
  let { date, amount } = transaction;
  return {
    ...transaction,
    date: formatDate(parseISO(date), dateFormat),
    amount: integerToAmount(amount || 0),
  };
}

function deserializeTransaction(transaction, originalTransaction, dateFormat) {
  let { amount, date, ...realTransaction } = transaction;

  let dayMonth = monthUtils.getDayMonthRegex(dateFormat);
  if (dayMonth.test(date)) {
    let test = parseDate(
      date,
      monthUtils.getDayMonthFormat(dateFormat),
      new Date(),
    );
    if (isValidDate(test)) {
      date = monthUtils.dayFromDate(test);
    } else {
      date = null;
    }
  } else {
    let test = parseDate(date, dateFormat, new Date());
    // This is a quick sanity check to make sure something invalid
    // like "year 201" was entered
    if (test.getFullYear() > 2000 && isValidDate(test)) {
      date = monthUtils.dayFromDate(test);
    } else {
      date = null;
    }
  }

  if (date == null) {
    date =
      (originalTransaction && originalTransaction.date) ||
      monthUtils.currentDay();
  }

  return { ...realTransaction, date, amount: amountToInteger(amount || 0) };
}

export function getDescriptionPretty(transaction, payee, transferAcct) {
  let { amount } = transaction;

  if (transferAcct) {
    return `Transfer ${amount > 0 ? 'from' : 'to'} ${transferAcct.name}`;
  } else if (payee) {
    return payee.name;
  }

  return '';
}

export function lookupName(items, id) {
  return items.find(item => item.id === id).name;
}

function isTemporary(transaction) {
  return transaction.id.indexOf('temp') === 0;
}

function makeTemporaryTransactions(currentAccountId, lastDate) {
  return [
    {
      id: 'temp',
      date: lastDate || monthUtils.currentDay(),
      account: currentAccountId,
      amount: 0,
      cleared: false,
    },
  ];
}

function _Transaction(props) {
  let { accountId, onTransactionsChange: onChange, transactions } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    props.getCategories();
    props.getAccounts();
  }, []);
  const [deleted, setDeleted] = useState(false);

  const {
    categories,
    accounts,
    payees,
    navigation,
    lastTransaction,
    dateFormat,
  } = props;

  let adding = false;

  const onEdit = async transaction => {
    // Run the rules to auto-fill in any data. Right now we only do
    // this on new transactions because that's how desktop works.
    if (isTemporary(transaction)) {
      let afterRules = await send('rules-run', { transaction });
      let diff = getChangedValues(transaction, afterRules);

      let newTransaction = { ...transaction };
      if (diff) {
        Object.keys(diff).forEach(field => {
          if (newTransaction[field] == null) {
            newTransaction[field] = diff[field];
          }
        });
      }
      return newTransaction;
    }

    return transaction;
  };

  const onSave = async newTransactions => {
    if (deleted) {
      return;
    }

    const changes = diffItems(transactions || [], newTransactions);
    if (
      changes.added.length > 0 ||
      changes.updated.length > 0 ||
      changes.deleted.length
    ) {
      const remoteUpdates = await send('transactions-batch-update', {
        added: changes.added,
        deleted: changes.deleted,
        updated: changes.updated,
      });

      if (onChange) {
        onChange({
          ...changes,
          updated: changes.updated.concat(remoteUpdates),
        });
      }
    }

    // If transactions is null, we are adding a new transaction
    if (transactions === null) {
      // The first one is always the "parent" and the only one we care
      // about
      props.setLastTransaction(newTransactions[0]);
    }
  };

  const onDelete = async () => {
    // Eagerly go back
    navigate(-1);

    if (transactions === null) {
      // Adding a new transactions, this disables saving when the component unmounts
      setDeleted(true);
    } else {
      const changes = { deleted: transactions };
      const remoteUpdates = await send('transactions-batch-update', changes);
      if (onChange) {
        onChange({ ...changes, updated: remoteUpdates });
      }
    }
  };

  if (transactions === null) {
    // Create an empty transaction
    transactions = makeTemporaryTransactions(
      accountId || (lastTransaction && lastTransaction.account) || null,
      lastTransaction && lastTransaction.date,
    );
    adding = true;
  }

  if (categories.length === 0 || accounts.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        // paddingTop: this.props.insets.top,
        // paddingBottom: this.props.insets.bottom,
        flex: 1,
        backgroundColor: colors.p5,
      }}
    >
      {/* <FocusAwareStatusBar barStyle="light-content" animated={true} /> */}
      <MobileTransactionEdit
        transactions={transactions}
        adding={adding}
        categories={categories}
        accounts={accounts}
        payees={payees}
        navigation={navigation}
        renderChildEdit={props => <ChildEdit {...props} />}
        dateFormat={dateFormat}
        onEdit={onEdit}
        onSave={onSave}
        onDelete={onDelete}
      />
    </View>
  );
}

export default connect(
  state => ({
    categories: state.queries.categories.list,
    payees: state.queries.payees,
    lastTransaction: state.queries.lastTransaction,
    accounts: state.queries.accounts,
    dateFormat: state.prefs.local.dateFormat || 'MM/dd/yyyy',
  }),
  dispatch => bindActionCreators(actions, dispatch),
)(_Transaction);
